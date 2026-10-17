import config from "../../config/config.js";
import { isIntent, type Intent } from "./parseUtterance.js";

const CONFIDENT = 0.5;

type ChoiceAnswer = {
    type: "choice";
    choice: string;
    confidence?: number;
};

type SystemOneResponse = {
    answers?: Record<string, ChoiceAnswer>;
};

async function systemOne(
    apiKey: string,
    state: unknown,
    questions: Record<string, unknown>
): Promise<SystemOneResponse | null> {
    try {
        const response = await fetch("https://api.typesafe.ai/v1/systemone", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ state, model: "jev-latest", questions }),
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return null;
        return (await response.json()) as SystemOneResponse;
    } catch {
        return null;
    }
}

export async function classifyIntent(text: string): Promise<Intent | null> {
    if (!config.typesafeApiKey) return null;
    const data = await systemOne(config.typesafeApiKey, { message: text }, {
        intent: {
            type: "choice",
            instructions: "What is the user asking the store copilot to do?",
            criteria: {
                stock: "Ask how much of an item is on hand",
                my_schedule: "Ask about their own shifts",
                week: "Ask who is working a shift",
                import: "Receive stock into this store",
                export: "Use stock for production",
                transfer: "Move stock to another store",
                assign: "Put a person on a shift",
                other: "Anything else, including a prose report",
            },
        },
    });
    const answer = data?.answers?.intent;
    if (!answer || answer.type !== "choice" || !isIntent(answer.choice)) return null;
    if ((answer.confidence ?? 0) < CONFIDENT || answer.choice === "other") return null;
    return answer.choice;
}

export async function chooseCandidate(
    text: string,
    options: { id: string; label: string }[]
): Promise<string | null> {
    if (!config.typesafeApiKey || options.length < 2) return null;
    const criteria: Record<string, string> = { none: "None of these" };
    for (const option of options.slice(0, 20)) {
        criteria[option.id] = option.label;
    }
    const data = await systemOne(config.typesafeApiKey, { message: text }, {
        pick: {
            type: "choice",
            instructions: "Which listed option does the user mean?",
            criteria,
        },
    });
    const answer = data?.answers?.pick;
    if (!answer || answer.type !== "choice") return null;
    if ((answer.confidence ?? 0) < CONFIDENT || answer.choice === "none") return null;
    if (!options.some((option) => option.id === answer.choice)) return null;
    return answer.choice;
}

type ClaudeBlock =
    | { type: "text"; text: string }
    | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

type ClaudeMessage = {
    role: "user" | "assistant";
    content: string | ClaudeBlock[] | { type: "tool_result"; tool_use_id: string; content: string }[];
};

export async function claudeReply(input: {
    text: string;
    facts: string;
    tools: { name: string; description: string; input_schema: Record<string, unknown> }[];
    runTool: (name: string, args: Record<string, unknown>) => Promise<string>;
}): Promise<string | null> {
    if (!config.anthropicApiKey) return null;
    const messages: ClaudeMessage[] = [{ role: "user", content: input.text.slice(0, 1000) }];

    for (let hop = 0; hop < 4; hop += 1) {
        let payload: { content?: ClaudeBlock[]; stop_reason?: string };
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": config.anthropicApiKey,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-5",
                    max_tokens: 1024,
                    system: input.facts,
                    messages,
                    tools: input.tools,
                }),
                signal: AbortSignal.timeout(20000),
            });
            if (!response.ok) return null;
            payload = (await response.json()) as { content?: ClaudeBlock[]; stop_reason?: string };
        } catch {
            return null;
        }

        const content = payload.content ?? [];
        messages.push({ role: "assistant", content });
        const toolUses = content.filter((block) => block.type === "tool_use");
        if (toolUses.length === 0) {
            const text = content.find((block) => block.type === "text");
            return text && text.type === "text" ? text.text : null;
        }

        const results: { type: "tool_result"; tool_use_id: string; content: string }[] = [];
        for (const tool of toolUses) {
            if (tool.type !== "tool_use") continue;
            const result = await input.runTool(tool.name, tool.input ?? {});
            results.push({ type: "tool_result" as const, tool_use_id: tool.id, content: result });
        }
        messages.push({ role: "user", content: results });
    }

    return "I could not finish that. Ask about one item or one shift.";
}

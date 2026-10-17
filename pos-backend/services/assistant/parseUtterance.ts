export type Intent =
    | "stock"
    | "my_schedule"
    | "week"
    | "import"
    | "export"
    | "transfer"
    | "assign"
    | "other";

export type ExportReason = "production" | "to_store";

export type ParsedUtterance = {
    intent: Intent;
    quantity: number | null;
    unit: string | null;
    unitCost: number | null;
    itemPhrase: string | null;
    memberPhrase: string | null;
    memberId: string | null;
    scheduleId: string | null;
    weekday: number | null;
    meal: string | null;
    reason: ExportReason | null;
};

const WEEKDAYS: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

const MEALS = ["dinner", "lunch", "breakfast", "closing", "opening"];

const INTENTS = new Set<Intent>([
    "stock",
    "my_schedule",
    "week",
    "import",
    "export",
    "transfer",
    "assign",
    "other",
]);

export function isIntent(value: string): value is Intent {
    return INTENTS.has(value as Intent);
}

function parseLooseNumber(raw: string): number | null {
    const trimmed = raw.trim();
    const thousands = /^\d{1,3}(\.\d{3})+$/;
    const normalized = thousands.test(trimmed)
        ? trimmed.replace(/\./g, "")
        : trimmed.replace(/,/g, "");
    const value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0) return null;
    return value;
}

function detectIntent(text: string): Intent {
    const lowered = text.toLowerCase();
    if (/\bassign\b/.test(lowered)) return "assign";
    if (/\b(transfer|move)\b/.test(lowered) || lowered.includes("other store")) return "transfer";
    if (/\b(import|receive|received)\b/.test(lowered)) return "import";
    if (/\bexport\b/.test(lowered)) return "export";
    if (lowered.includes("my shift") || lowered.includes("my schedule")) return "my_schedule";
    if (lowered.includes("who is") || lowered.includes("who works") || lowered.includes("who's")) {
        return "week";
    }
    if (
        lowered.includes("how much") ||
        lowered.includes("how many") ||
        lowered.includes("on hand") ||
        lowered.includes("is left") ||
        lowered.includes("do we have")
    ) {
        return "stock";
    }
    return "other";
}

function readQuantity(text: string): { quantity: number | null; unit: string | null } {
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|liter|ml|piece|pack|box|bag)\b/i);
    if (!match) return { quantity: null, unit: null };
    return {
        quantity: parseLooseNumber(match[1]),
        unit: match[2].toLowerCase(),
    };
}

function readCost(text: string): number | null {
    const match = text.match(/(?:unit cost|cost)\s*[:=]?\s*(\d[\d.,]*)/i);
    if (!match) return null;
    return parseLooseNumber(match[1]);
}

function readWeekday(text: string): number | null {
    const lowered = text.toLowerCase();
    for (const [name, index] of Object.entries(WEEKDAYS)) {
        if (lowered.includes(name)) return index;
    }
    return null;
}

function readMeal(text: string): string | null {
    const lowered = text.toLowerCase();
    return MEALS.find((meal) => lowered.includes(meal)) ?? null;
}

function readItemPhrase(text: string): string | null {
    let phrase = text;
    phrase = phrase.replace(/(?:unit cost|cost)\s*[:=]?\s*\d[\d.,]*/gi, " ");
    phrase = phrase.replace(/\d+(?:[.,]\d+)?\s*(?:kg|g|liter|ml|piece|pack|box|bag)\b/gi, " ");
    phrase = phrase.replace(
        /\b(how much|how many|is left|on hand|do we have|what is|what's|import|export|received|receive|move|transfer|for production|to the other store|the other store|other store|please|into stock)\b/gi,
        " "
    );
    phrase = phrase.replace(/[?.,!]/g, " ");
    phrase = phrase.replace(/\b(a|an|the|we|of|me)\b/gi, " ");
    phrase = phrase.replace(/\s+/g, " ").trim();
    if (phrase.length < 2) return null;
    return phrase;
}

export function parseUtterance(text: string): ParsedUtterance {
    const intent = detectIntent(text);
    const { quantity, unit } = readQuantity(text);
    const memberMatch = text.match(/\bassign\s+(.+?)\s+to\b/i);
    const memberIdMatch = text.match(/\bmember\s+([a-f0-9]{24})\b/i);
    const scheduleIdMatch = text.match(/\bschedule\s+([a-f0-9]{24})\b/i);
    const itemIntent = intent === "stock" || intent === "import" || intent === "export" || intent === "transfer";
    let reason: ExportReason | null = null;
    if (intent === "transfer" || text.toLowerCase().includes("other store")) reason = "to_store";
    else if (intent === "export") reason = "production";

    return {
        intent,
        quantity,
        unit,
        unitCost: readCost(text),
        itemPhrase: itemIntent ? readItemPhrase(text) : null,
        memberPhrase: memberMatch?.[1]?.trim() || null,
        memberId: memberIdMatch?.[1] ?? null,
        scheduleId: scheduleIdMatch?.[1] ?? null,
        weekday: readWeekday(text),
        meal: readMeal(text),
        reason,
    };
}

import createHttpError from "http-errors";
import mongoose from "mongoose";
import StorageItem from "../../models/storageItemModel.js";
import Schedule from "../../models/scheduleModel.js";
import Store from "../../models/storeModel.js";
import StoreUser from "../../models/storeUserModel.js";
import AssistantDraft from "../../models/assistantDraftModel.js";
import { createStorageImport } from "../../controllers/storageImportController.js";
import { cancelStorageExport, createStorageExport } from "../../controllers/storageExportController.js";
import { assignMemberToShift } from "../../controllers/scheduleController.js";
import { formatVietnamTime, getISOWeek, getStartOfDayVietnam, toVietnamTime } from "../../utils/dateUtils.js";
import { capabilitiesForRole } from "./capabilities.js";
import { errorMessage, invokeHandler, isRecord, readId } from "./invokeHandler.js";
import { chooseCandidate, claudeReply, classifyIntent } from "./modelClients.js";
import { parseUtterance, type Intent, type ParsedUtterance } from "./parseUtterance.js";

export type Slip = {
    draftId: string;
    title: string;
    confirm: string;
    blocked: string;
    rows: [string, string][];
};

export type Choice = { label: string; text: string };

export type ChatResult = {
    reply: string | null;
    slip: Slip | null;
    choices: Choice[] | null;
};

type Actor = {
    _id: mongoose.Types.ObjectId;
    name?: string;
    role?: string;
};

type StoreRef = {
    _id: mongoose.Types.ObjectId;
    name?: string;
};

type ItemDoc = {
    _id: mongoose.Types.ObjectId;
    name: string;
    code: string;
    unit: string;
    currentStock: number;
    lastPurchaseCost?: number;
    averageCost?: number;
};

const READ_TOOLS = [
    {
        name: "search_storage_items",
        description: "Find active storage items in the current store by name.",
        input_schema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
        },
    },
    {
        name: "get_my_schedule",
        description: "List the caller's shifts for the next 7 days at this store.",
        input_schema: { type: "object", properties: {} },
    },
];

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findItems(storeId: mongoose.Types.ObjectId, phrase: string): Promise<ItemDoc[]> {
    const exact = await StorageItem.find({
        store: storeId,
        isActive: true,
        name: new RegExp(`^${escapeRegExp(phrase)}$`, "i"),
    }).limit(5);
    if (exact.length > 0) return exact as ItemDoc[];
    return StorageItem.find({
        store: storeId,
        isActive: true,
        name: new RegExp(escapeRegExp(phrase), "i"),
    }).limit(5) as Promise<ItemDoc[]>;
}

async function resolveItem(
    text: string,
    storeId: mongoose.Types.ObjectId,
    phrase: string | null
): Promise<{ item: ItemDoc | null; choices: Choice[] | null; reply: string | null }> {
    if (!phrase) {
        return { item: null, choices: null, reply: "Name the item." };
    }
    const items = await findItems(storeId, phrase);
    if (items.length === 0) {
        return { item: null, choices: null, reply: `No item matches “${phrase}” at this store.` };
    }
    if (items.length === 1) return { item: items[0], choices: null, reply: null };
    const picked = await chooseCandidate(
        text,
        items.map((item) => ({ id: String(item._id), label: `${item.name} (${item.unit})` }))
    );
    const chosen = items.find((item) => String(item._id) === picked);
    if (chosen) return { item: chosen, choices: null, reply: null };
    return {
        item: null,
        reply: "Which item?",
        choices: items.map((item) => ({
            label: `${item.name} · ${item.unit}`,
            text: item.name,
        })),
    };
}

async function stockReply(storeId: mongoose.Types.ObjectId, text: string, parsed: ParsedUtterance): Promise<ChatResult> {
    const resolved = await resolveItem(text, storeId, parsed.itemPhrase);
    if (!resolved.item) {
        return { reply: resolved.reply, slip: null, choices: resolved.choices };
    }
    const item = resolved.item;
    return {
        reply: `${item.name} on hand: ${item.currentStock} ${item.unit}.`,
        slip: null,
        choices: null,
    };
}

async function myScheduleReply(storeId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<ChatResult> {
    const start = getStartOfDayVietnam(new Date());
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    const rows = await Schedule.find({
        store: storeId,
        "assignedMembers.member": userId,
        date: { $gte: start, $lt: end },
    })
        .populate("shiftTemplate", "name")
        .sort({ date: 1 })
        .limit(8);

    if (rows.length === 0) {
        return { reply: "No shifts in the next 7 days at this store.", slip: null, choices: null };
    }
    const lines = rows.map((row) => {
        const template = row.shiftTemplate as { name?: string } | null;
        const when = formatVietnamTime(row.date, "EEE d MMM");
        return `${when} · ${template?.name || "Shift"}`;
    });
    return { reply: lines.join("\n"), slip: null, choices: null };
}

function memberName(member: unknown): string {
    if (isRecord(member) && typeof member.name === "string") return member.name;
    return "Open";
}

async function weekReply(storeId: mongoose.Types.ObjectId, parsed: ParsedUtterance): Promise<ChatResult> {
    if (parsed.weekday === null) {
        return { reply: "Name the day.", slip: null, choices: null };
    }
    const { year, weekNumber } = getISOWeek(new Date());
    const rows = await Schedule.find({ store: storeId, year, weekNumber })
        .populate("shiftTemplate", "name")
        .populate("assignedMembers.member", "name")
        .sort({ date: 1 });

    const matched = rows.filter((row) => {
        const day = toVietnamTime(row.date).getDay();
        if (day !== parsed.weekday) return false;
        if (!parsed.meal) return true;
        const template = row.shiftTemplate as { name?: string } | null;
        return (template?.name || "").toLowerCase().includes(parsed.meal);
    });

    if (matched.length === 0) {
        return { reply: "No matching shift at this store.", slip: null, choices: null };
    }
    const lines = matched.map((row) => {
        const template = row.shiftTemplate as { name?: string } | null;
        const names = (row.assignedMembers || []).map((entry: { member?: unknown }) => memberName(entry.member));
        const who = names.length > 0 ? names.join(", ") : "nobody assigned";
        return `${formatVietnamTime(row.date, "EEE d MMM")} · ${template?.name || "Shift"} · ${who}`;
    });
    return { reply: lines.join("\n"), slip: null, choices: null };
}

async function saveDraft(input: {
    userId: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;
    kind: "import" | "export" | "assign" | "transfer";
    payload: Record<string, unknown>;
    blockers: string[];
    slip: Omit<Slip, "draftId">;
}): Promise<ChatResult> {
    const draft = await AssistantDraft.create({
        user: input.userId,
        store: input.storeId,
        kind: input.kind,
        payload: input.payload,
        blockers: input.blockers,
    });
    return {
        reply: null,
        choices: null,
        slip: { ...input.slip, draftId: String(draft._id) },
    };
}

function money(value: number | null): string {
    return value === null ? "Missing" : String(value);
}

async function importDraft(
    text: string,
    actor: Actor,
    store: StoreRef,
    parsed: ParsedUtterance
): Promise<ChatResult> {
    const resolved = await resolveItem(text, store._id, parsed.itemPhrase);
    if (!resolved.item) return { reply: resolved.reply, slip: null, choices: resolved.choices };
    const item = resolved.item;
    const blockers: string[] = [];
    if (!parsed.quantity) blockers.push("Quantity needed");
    if (parsed.unit && parsed.unit !== item.unit) blockers.push(`This item is tracked in ${item.unit}`);
    if (parsed.unitCost === null) blockers.push("Unit cost needed");
    const quantity = parsed.quantity ?? 0;
    const after = parsed.quantity ? item.currentStock + parsed.quantity : null;
    return saveDraft({
        userId: actor._id,
        storeId: store._id,
        kind: "import",
        blockers,
        payload: {
            storageItemId: String(item._id),
            quantity,
            unitCost: parsed.unitCost,
            source: "supplier",
        },
        slip: {
            title: "Import",
            confirm: "Confirm import",
            blocked: blockers[0] || "",
            rows: [
                ["Item", item.name],
                ["Quantity", parsed.quantity ? `${parsed.quantity} ${item.unit}` : "Missing"],
                ["Unit cost", money(parsed.unitCost)],
                ["On hand after", after === null ? "Unknown" : `${after} ${item.unit}`],
                ["Store", store.name || "This store"],
            ],
        },
    });
}

async function exportDraft(
    text: string,
    actor: Actor,
    store: StoreRef,
    parsed: ParsedUtterance
): Promise<ChatResult> {
    const resolved = await resolveItem(text, store._id, parsed.itemPhrase);
    if (!resolved.item) return { reply: resolved.reply, slip: null, choices: resolved.choices };
    const item = resolved.item;
    const blockers: string[] = [];
    if (!parsed.quantity) blockers.push("Quantity needed");
    if (parsed.unit && parsed.unit !== item.unit) blockers.push(`This item is tracked in ${item.unit}`);
    if (parsed.quantity && item.currentStock < parsed.quantity) {
        blockers.push(`On hand is ${item.currentStock} ${item.unit}`);
    }
    const quantity = parsed.quantity ?? 0;
    const after = parsed.quantity ? item.currentStock - parsed.quantity : null;
    return saveDraft({
        userId: actor._id,
        storeId: store._id,
        kind: "export",
        blockers,
        payload: {
            storageItemId: String(item._id),
            quantity,
            reason: "production",
        },
        slip: {
            title: "Export",
            confirm: "Confirm export",
            blocked: blockers[0] || "",
            rows: [
                ["Item", item.name],
                ["Quantity", parsed.quantity ? `${parsed.quantity} ${item.unit}` : "Missing"],
                ["Reason", "Production"],
                ["On hand after", after === null ? "Unknown" : `${after} ${item.unit}`],
                ["Store", store.name || "This store"],
            ],
        },
    });
}

async function transferDraft(
    text: string,
    actor: Actor,
    store: StoreRef,
    parsed: ParsedUtterance
): Promise<ChatResult> {
    const resolved = await resolveItem(text, store._id, parsed.itemPhrase);
    if (!resolved.item) return { reply: resolved.reply, slip: null, choices: resolved.choices };
    const item = resolved.item;
    const others = await Store.find({ isActive: true, _id: { $ne: store._id } }).select("name");
    const named = others.find((other) => text.toLowerCase().includes(String(other.name).toLowerCase()));
    const destination = named || (others.length === 1 ? others[0] : null);
    const blockers: string[] = [];
    if (!destination) blockers.push("Name the other store");
    if (!parsed.quantity) blockers.push("Quantity needed");
    if (parsed.quantity && item.currentStock < parsed.quantity) {
        blockers.push(`On hand is ${item.currentStock} ${item.unit}`);
    }
    const unitCost = item.lastPurchaseCost || item.averageCost || 0;
    if (!unitCost) blockers.push("Unit cost needed");
    let destinationItemId: string | null = null;
    if (destination) {
        const mirror = await StorageItem.findOne({
            store: destination._id,
            code: item.code,
            isActive: true,
        }).select("_id");
        if (!mirror) blockers.push("The other store has no item with this code");
        else destinationItemId = String(mirror._id);
    }
    return saveDraft({
        userId: actor._id,
        storeId: store._id,
        kind: "transfer",
        blockers,
        payload: {
            storageItemId: String(item._id),
            destinationItemId,
            destinationStoreId: destination ? String(destination._id) : null,
            quantity: parsed.quantity ?? 0,
            unitCost,
        },
        slip: {
            title: "Transfer",
            confirm: "Confirm transfer",
            blocked: blockers[0] || "",
            rows: [
                ["Item", item.name],
                ["Quantity", parsed.quantity ? `${parsed.quantity} ${item.unit}` : "Missing"],
                ["From", store.name || "This store"],
                ["To", destination?.name || "Missing"],
                ["Unit cost", unitCost ? String(unitCost) : "Missing"],
            ],
        },
    });
}

async function assignDraft(
    text: string,
    actor: Actor,
    store: StoreRef,
    parsed: ParsedUtterance
): Promise<ChatResult> {
    if (actor.role !== "Admin") {
        return { reply: "Only an admin can change shifts.", slip: null, choices: null };
    }
    const memberships = await StoreUser.find({ store: store._id, isActive: true }).populate("user", "name isActive");
    const people = memberships
        .map((row) => row.user as { _id?: mongoose.Types.ObjectId; name?: string; isActive?: boolean } | null)
        .filter((user) => user && user.isActive !== false && user.name);

    let member = parsed.memberId
        ? people.find((user) => String(user?._id) === parsed.memberId) || null
        : null;
    if (!member && parsed.memberPhrase) {
        const matches = people.filter((user) =>
            String(user?.name).toLowerCase().includes(parsed.memberPhrase!.toLowerCase())
        );
        if (matches.length > 1) {
            return {
                reply: "Which person?",
                slip: null,
                choices: matches.map((user) => ({
                    label: String(user?.name),
                    text: `Assign member ${String(user?._id)} to ${parsed.meal || "shift"}`,
                })),
            };
        }
        member = matches[0] || null;
    }
    if (!member?._id) {
        return { reply: "No matching member at this store.", slip: null, choices: null };
    }

    let scheduleId = parsed.scheduleId;
    let whenLabel = parsed.meal || "Shift";
    if (!scheduleId) {
        if (parsed.weekday === null) return { reply: "Name the day.", slip: null, choices: null };
        const { year, weekNumber } = getISOWeek(new Date());
        const rows = await Schedule.find({ store: store._id, year, weekNumber }).populate("shiftTemplate", "name");
        const matched = rows.filter((row) => {
            if (toVietnamTime(row.date).getDay() !== parsed.weekday) return false;
            if (!parsed.meal) return true;
            const template = row.shiftTemplate as { name?: string } | null;
            return (template?.name || "").toLowerCase().includes(parsed.meal);
        });
        if (matched.length === 0) return { reply: "No matching shift at this store.", slip: null, choices: null };
        if (matched.length > 1) {
            return {
                reply: "Which shift?",
                slip: null,
                choices: matched.map((row) => {
                    const template = row.shiftTemplate as { name?: string } | null;
                    const label = `${formatVietnamTime(row.date, "EEE d MMM")} · ${template?.name || "Shift"}`;
                    return { label, text: `Assign member ${String(member?._id)} to schedule ${String(row._id)}` };
                }),
            };
        }
        scheduleId = String(matched[0]._id);
        const template = matched[0].shiftTemplate as { name?: string } | null;
        whenLabel = `${formatVietnamTime(matched[0].date, "EEE d MMM")} · ${template?.name || "Shift"}`;
    }

    return saveDraft({
        userId: actor._id,
        storeId: store._id,
        kind: "assign",
        blockers: [],
        payload: { scheduleId, memberId: String(member._id) },
        slip: {
            title: "Shift",
            confirm: "Confirm assign",
            blocked: "",
            rows: [
                ["Member", String(member.name)],
                ["When", whenLabel],
                ["Store", store.name || "This store"],
            ],
        },
    });
}

async function proseReply(text: string, actor: Actor, store: StoreRef): Promise<ChatResult> {
    const today = formatVietnamTime(new Date(), "yyyy-MM-dd");
    const reply = await claudeReply({
        text,
        facts: [
            `Store: ${store.name || "current store"} (${String(store._id)}).`,
            `User role: ${actor.role || "User"}.`,
            `Today: ${today}.`,
            "Answer only from tool results. Do not invent quantities or shift names.",
            "Do not claim a stock move or a shift change was saved.",
            "If the user wants a write, tell them to state an import, an export, or an assign.",
        ].join(" "),
        tools: READ_TOOLS,
        runTool: async (name, args) => {
            if (name === "search_storage_items") {
                const query = typeof args.query === "string" ? args.query : "";
                const items = query ? await findItems(store._id, query) : [];
                return JSON.stringify(items.map((item) => ({
                    name: item.name,
                    unit: item.unit,
                    onHand: item.currentStock,
                })));
            }
            if (name === "get_my_schedule") {
                const result = await myScheduleReply(store._id, actor._id);
                return result.reply || "";
            }
            return "Unknown tool";
        },
    });
    return {
        reply: reply || "Ask about stock, your shifts, an import, or an export.",
        slip: null,
        choices: null,
    };
}

async function dispatch(text: string, actor: Actor, store: StoreRef, parsed: ParsedUtterance): Promise<ChatResult> {
    switch (parsed.intent) {
        case "stock":
            return stockReply(store._id, text, parsed);
        case "my_schedule":
            return myScheduleReply(store._id, actor._id);
        case "week":
            return weekReply(store._id, parsed);
        case "import":
            return importDraft(text, actor, store, parsed);
        case "export":
            return exportDraft(text, actor, store, parsed);
        case "transfer":
            return transferDraft(text, actor, store, parsed);
        case "assign":
            return assignDraft(text, actor, store, parsed);
        default:
            return proseReply(text, actor, store);
    }
}

export function listCapabilities(role: string | undefined) {
    return capabilitiesForRole(role);
}

export async function handleChat(text: string, actor: Actor, store: StoreRef): Promise<ChatResult> {
    const trimmed = text.trim();
    if (!trimmed) throw createHttpError(400, "Message is empty");
    const parsed = parseUtterance(trimmed);
    if (parsed.intent === "other") {
        const classified = await classifyIntent(trimmed);
        if (classified) parsed.intent = classified;
    }
    return dispatch(trimmed, actor, store, parsed);
}

function numberField(payload: Record<string, unknown>, key: string): number {
    const value = payload[key];
    return typeof value === "number" ? value : Number(value);
}

export async function commitDraft(draftId: string, actor: Actor, store: StoreRef): Promise<string> {
    if (!mongoose.Types.ObjectId.isValid(draftId)) throw createHttpError(400, "Invalid draft");
    const draft = await AssistantDraft.findOne({ _id: draftId, user: actor._id, store: store._id, status: "pending" });
    if (!draft) throw createHttpError(404, "Draft not found");
    if (draft.blockers.length > 0) throw createHttpError(400, draft.blockers[0]);
    if (!isRecord(draft.payload)) throw createHttpError(400, "Draft is empty");
    const payload = draft.payload;
    const reqBase = { user: actor, store, body: {}, params: {}, query: {} };

    if (draft.kind === "import") {
        await invokeHandler(createStorageImport, {
            ...reqBase,
            body: {
                storageItemId: payload.storageItemId,
                quantity: numberField(payload, "quantity"),
                unitCost: numberField(payload, "unitCost"),
                source: "supplier",
                notes: "Copilot",
            },
        });
        draft.status = "committed";
        await draft.save();
        return "Import saved";
    }

    if (draft.kind === "export") {
        await invokeHandler(createStorageExport, {
            ...reqBase,
            body: {
                storageItemId: payload.storageItemId,
                quantity: numberField(payload, "quantity"),
                reason: "production",
                notes: "Copilot",
            },
        });
        draft.status = "committed";
        await draft.save();
        return "Export saved";
    }

    if (draft.kind === "assign") {
        if (actor.role !== "Admin") throw createHttpError(403, "Only an admin can change shifts.");
        await invokeHandler(assignMemberToShift, {
            ...reqBase,
            params: { id: String(payload.scheduleId) },
            body: { memberId: String(payload.memberId) },
        });
        draft.status = "committed";
        await draft.save();
        return "Shift saved";
    }

    const destinationStoreId = String(payload.destinationStoreId || "");
    const destination = await Store.findById(destinationStoreId).select("name isActive");
    if (!destination || destination.isActive === false) throw createHttpError(400, "Name the other store");

    const exported = await invokeHandler(createStorageExport, {
        ...reqBase,
        body: {
            storageItemId: payload.storageItemId,
            quantity: numberField(payload, "quantity"),
            reason: "to_store",
            destinationStore: destinationStoreId,
            notes: "Copilot transfer",
        },
    });
    const exportId = readId(exported.body);
    try {
        await invokeHandler(createStorageImport, {
            user: actor,
            store: { _id: destination._id, name: destination.name },
            params: {},
            query: {},
            body: {
                storageItemId: payload.destinationItemId,
                quantity: numberField(payload, "quantity"),
                unitCost: numberField(payload, "unitCost"),
                source: "from_store",
                sourceStore: String(store._id),
                notes: "Copilot transfer",
            },
        });
    } catch (error) {
        if (exportId) {
            await invokeHandler(cancelStorageExport, {
                ...reqBase,
                params: { id: exportId },
            }).catch(() => undefined);
        }
        throw createHttpError(400, errorMessage(error));
    }
    draft.status = "committed";
    await draft.save();
    return "Transfer saved";
}

export async function cancelDraft(draftId: string, actor: Actor, store: StoreRef): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(draftId)) throw createHttpError(400, "Invalid draft");
    const draft = await AssistantDraft.findOne({ _id: draftId, user: actor._id, store: store._id, status: "pending" });
    if (!draft) throw createHttpError(404, "Draft not found");
    draft.status = "canceled";
    await draft.save();
}

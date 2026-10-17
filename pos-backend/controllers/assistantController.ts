import type { NextFunction, Request, Response } from "express";
import { cancelDraft, commitDraft, handleChat, listCapabilities } from "../services/assistant/assistantService.js";
import { errorMessage } from "../services/assistant/invokeHandler.js";

type ActorRequest = Request & {
    user?: { _id?: unknown; name?: string; role?: string };
    store?: { _id?: unknown; name?: string };
};

function actorFrom(req: ActorRequest) {
    const user = req.user;
    const store = req.store;
    if (!user?._id || !store?._id) {
        throw Object.assign(new Error("Store selection required"), { statusCode: 400 });
    }
    return {
        user: {
            _id: user._id as import("mongoose").Types.ObjectId,
            name: user.name,
            role: user.role,
        },
        store: {
            _id: store._id as import("mongoose").Types.ObjectId,
            name: store.name,
        },
    };
}

const capabilities = (req: ActorRequest, res: Response, next: NextFunction) => {
    try {
        const { user } = actorFrom(req);
        res.status(200).json({ success: true, data: listCapabilities(user.role) });
    } catch (error) {
        next(error);
    }
};

const chat = async (req: ActorRequest, res: Response, next: NextFunction) => {
    try {
        const { user, store } = actorFrom(req);
        const text = typeof req.body?.text === "string" ? req.body.text : "";
        const data = await handleChat(text, user, store);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const commit = async (req: ActorRequest, res: Response, next: NextFunction) => {
    try {
        const { user, store } = actorFrom(req);
        const draftId = typeof req.body?.draftId === "string" ? req.body.draftId : "";
        const message = await commitDraft(draftId, user, store);
        res.status(200).json({ success: true, message, data: { message } });
    } catch (error) {
        if (error instanceof Error && !("statusCode" in error) && !("status" in error)) {
            next(Object.assign(error, { statusCode: 400, message: errorMessage(error) }));
            return;
        }
        next(error);
    }
};

const cancel = async (req: ActorRequest, res: Response, next: NextFunction) => {
    try {
        const { user, store } = actorFrom(req);
        const draftId = typeof req.body?.draftId === "string" ? req.body.draftId : "";
        await cancelDraft(draftId, user, store);
        res.status(200).json({ success: true, message: "Canceled. Nothing was saved." });
    } catch (error) {
        next(error);
    }
};

export { capabilities, chat, commit, cancel };

type Handler = (req: unknown, res: unknown, next: (error?: unknown) => void) => unknown;

export async function invokeHandler(
    handler: Handler,
    req: unknown
): Promise<{ status: number; body: unknown }> {
    return new Promise((resolve, reject) => {
        let status = 200;
        const res = {
            status(code: number) {
                status = code;
                return this;
            },
            json(body: unknown) {
                resolve({ status, body });
            },
        };
        Promise.resolve(handler(req, res, (error?: unknown) => {
            if (error) reject(error);
        })).catch(reject);
    });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function errorMessage(error: unknown): string {
    if (isRecord(error) && typeof error.message === "string") return error.message;
    return "Request failed";
}

export function readId(body: unknown): string | null {
    if (!isRecord(body) || !isRecord(body.data) || body.data._id == null) return null;
    return String(body.data._id);
}

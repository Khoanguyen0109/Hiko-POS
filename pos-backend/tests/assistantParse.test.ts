import { describe, expect, it } from "@jest/globals";
import { parseUtterance } from "../services/assistant/parseUtterance.js";

describe("parseUtterance", () => {
    it("reads a stock question", () => {
        const parsed = parseUtterance("How much rice is left?");
        expect(parsed.intent).toBe("stock");
        expect(parsed.itemPhrase).toBe("rice");
    });

    it("reads the caller's week", () => {
        expect(parseUtterance("What is my shift this week?").intent).toBe("my_schedule");
    });

    it("reads an import with quantity and cost", () => {
        const parsed = parseUtterance("We received 10 kg flour, unit cost 45,000");
        expect(parsed.intent).toBe("import");
        expect(parsed.quantity).toBe(10);
        expect(parsed.unit).toBe("kg");
        expect(parsed.unitCost).toBe(45000);
        expect(parsed.itemPhrase).toBe("flour");
    });

    it("reads a production export", () => {
        const parsed = parseUtterance("Export 2 kg chicken for production");
        expect(parsed.intent).toBe("export");
        expect(parsed.quantity).toBe(2);
        expect(parsed.reason).toBe("production");
        expect(parsed.itemPhrase).toBe("chicken");
    });

    it("reads a transfer", () => {
        const parsed = parseUtterance("Move 3 kg chicken to the other store");
        expect(parsed.intent).toBe("transfer");
        expect(parsed.reason).toBe("to_store");
        expect(parsed.itemPhrase).toBe("chicken");
    });

    it("reads an assign", () => {
        const parsed = parseUtterance("Assign Mai to Friday dinner");
        expect(parsed.intent).toBe("assign");
        expect(parsed.memberPhrase).toBe("Mai");
        expect(parsed.weekday).toBe(5);
        expect(parsed.meal).toBe("dinner");
    });

    it("reads a week question", () => {
        const parsed = parseUtterance("Who is on Friday dinner?");
        expect(parsed.intent).toBe("week");
        expect(parsed.weekday).toBe(5);
        expect(parsed.meal).toBe("dinner");
    });
});

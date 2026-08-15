import { describe, expect, it } from "@jest/globals";
import { pickAssignedStores } from "../utils/assignedStores.js";

const storeA = { _id: "aaa", name: "Alpha", code: "A", isActive: true };
const storeB = { _id: "bbb", name: "Beta", code: "B", isActive: true };
const inactiveStore = { _id: "ccc", name: "Closed", code: "C", isActive: false };

describe("pickAssignedStores", () => {
  it("returns active assignments with active stores, sorted by name", () => {
    const result = pickAssignedStores(
      [
        { isActive: true, store: storeB },
        { isActive: true, store: storeA }
      ],
      { isAdmin: false }
    );

    expect(result.map((s) => s.name)).toEqual(["Alpha", "Beta"]);
    expect(result[0]).toEqual({ id: "aaa", name: "Alpha", code: "A" });
  });

  it("skips inactive assignments, inactive stores, and missing stores", () => {
    const result = pickAssignedStores(
      [
        { isActive: false, store: storeA },
        { isActive: true, store: inactiveStore },
        { isActive: true, store: null }
      ],
      { isAdmin: false }
    );

    expect(result).toEqual([]);
  });

  it("returns empty for a non-admin with no assignments", () => {
    const result = pickAssignedStores([], {
      isAdmin: false,
      fallbackStore: storeA
    });
    expect(result).toEqual([]);
  });

  it("falls back to the current store for an admin with no assignments", () => {
    const result = pickAssignedStores([], {
      isAdmin: true,
      fallbackStore: storeA
    });
    expect(result).toEqual([{ id: "aaa", name: "Alpha", code: "A" }]);
  });

  it("does not use the fallback when the admin already has assignments", () => {
    const result = pickAssignedStores(
      [{ isActive: true, store: storeB }],
      { isAdmin: true, fallbackStore: storeA }
    );
    expect(result).toEqual([{ id: "bbb", name: "Beta", code: "B" }]);
  });
});

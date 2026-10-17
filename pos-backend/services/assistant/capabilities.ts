export type CapabilityPrompt = {
    id: string;
    label: string;
    kind: "read" | "import" | "export" | "schedule";
};

const STAFF_PROMPTS: CapabilityPrompt[] = [
    { id: "stock", label: "How much rice is left?", kind: "read" },
    { id: "shifts", label: "What is my shift this week?", kind: "read" },
    { id: "import", label: "Import 5 kg rice", kind: "import" },
    { id: "export", label: "Export 2 kg chicken for production", kind: "export" },
];

const ADMIN_PROMPTS: CapabilityPrompt[] = [
    { id: "week", label: "Who is on Friday dinner?", kind: "read" },
    { id: "assign", label: "Assign Mai to Friday dinner", kind: "schedule" },
];

export function capabilitiesForRole(role: string | undefined): CapabilityPrompt[] {
    if (role === "Admin") return [...STAFF_PROMPTS, ...ADMIN_PROMPTS];
    return STAFF_PROMPTS;
}

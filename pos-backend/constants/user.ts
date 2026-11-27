const userRoles = {
    ADMIN: "Admin",
    STORE_MANAGER: "Store manager",
    USER: "User"
}

const isOrgAdmin = (role: string | undefined | null): boolean => role === userRoles.ADMIN;

const isStoreManagerRole = (role: string | undefined | null): boolean =>
    role === userRoles.STORE_MANAGER;

export { userRoles, isOrgAdmin, isStoreManagerRole };
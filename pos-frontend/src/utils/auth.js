// Authentication utility functions.
// The JWT lives in an httpOnly cookie managed by the server.
// We only persist the user profile in localStorage as a UI cache hint.

export const setAuthData = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("activeStore");
};

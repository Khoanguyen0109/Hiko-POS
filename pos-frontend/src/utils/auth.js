// Authentication utility functions.
// The JWT is stored in localStorage and sent as Authorization: Bearer header
// to support cross-origin deployments where third-party cookies are blocked.
// The httpOnly cookie is still set by the server as an additional fallback.

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

export const setAuthToken = (token) => {
  localStorage.setItem("accessToken", token);
};

export const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};

export const clearAuthData = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("activeStore");
  localStorage.removeItem("accessToken");
};

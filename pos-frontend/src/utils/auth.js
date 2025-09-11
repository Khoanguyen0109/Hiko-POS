// Authentication utility functions

export const setAuthData = (accessToken, user) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getAuthData = () => {
  const token = localStorage.getItem("accessToken");
  const user = localStorage.getItem("user");

  return {
    accessToken: token,
    user: user ? JSON.parse(user) : null,
    isAuthenticated: !!token,
  };
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

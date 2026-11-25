
const BACKEND_URL = "http://localhost:3001";

async function request(path, options) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

const keycloak = {
  // Redirect user to Keycloak login through backend
  login() {
    window.location.href = `${BACKEND_URL}/auth/login`;
  },

  // Redirect user to backend logout
  logout() {
    window.location.href = `${BACKEND_URL}/auth/logout`;
  },

  // Get currently logged-in user
  async getUser() {
    const response = await fetch(`${BACKEND_URL}/api/me`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to get user information");
    }

    const data = await response.json();

    return data.user ?? data;
  },

  async saveProfile(profile) {
    const response = await fetch(`${BACKEND_URL}/api/me/profile`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (response.status === 401) {
      this.login();
      throw new Error("Your session expired. Please sign in again.");
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Could not save your profile.");
    }
    return data.user;
  },

  getAccessToken() {
    return request("/api/me/access-token", { cache: "no-store" });
  },

  listUsers(first) {
    return request(`/api/admin/users?first=${first}`);
  },

  createUser(user) {
    return request("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
  },

  deleteUser(id) {
    return request(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  // Check whether user is logged in
  async isAuthenticated() {
    const user = await this.getUser();
    return user !== null;
  },
};

export default keycloak;

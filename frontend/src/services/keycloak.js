
const BACKEND_URL = "http://localhost:3001";

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

  // Check whether user is logged in
  async isAuthenticated() {
    const user = await this.getUser();
    return user !== null;
  },
};

export default keycloak;


import { useEffect, useState } from "react";
import "../App.css";

const BACKEND_URL = "http://localhost:3001";

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/me`, {
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.href = `${BACKEND_URL}/auth/login`;
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load user information");
        }

        const data = await response.json();
        setUser(data.user ?? data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const handleLogout = () => {
    window.location.href = `${BACKEND_URL}/auth/logout`;
  };

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>{error}</h2>;
  if (!user) return <h2>User not found</h2>;

  const roles = [
    ...(user.realm_access?.roles ?? []),
    ...Object.values(user.resource_access ?? {}).flatMap(
      (client) => client.roles ?? []
    ),
  ];

  const uniqueRoles = [...new Set(roles)];

  return (
    <div className="home-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {(user.given_name?.[0] ?? "U").toUpperCase()}
          </div>

          <h1>Welcome Home!</h1>
          <p>You have successfully logged in.</p>
        </div>

        <div className="profile-details">
          <div className="detail">
            <span>Username</span>
            <strong>{user.preferred_username ?? "N/A"}</strong>
          </div>

          <div className="detail">
            <span>First Name</span>
            <strong>{user.given_name ?? "N/A"}</strong>
          </div>

          <div className="detail">
            <span>Last Name</span>
            <strong>{user.family_name ?? "N/A"}</strong>
          </div>

          <div className="detail">
            <span>Email</span>
            <strong>{user.email ?? "N/A"}</strong>
          </div>

          <div className="detail roles-detail">
            <span>Roles</span>
            <div className="roles">
              {uniqueRoles.length > 0
                ? uniqueRoles.map((role) => (
                    <span className="role-badge" key={role}>
                      {role}
                    </span>
                  ))
                : "No roles assigned"}
            </div>
          </div>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Home;

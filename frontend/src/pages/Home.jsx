
import { useEffect, useState } from "react";
import keycloak from "../services/keycloak";
import "../App.css";

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await keycloak.getUser();
        if (!currentUser) {
          keycloak.login();
          return;
        }
        setUser(currentUser);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>{error}</h2>;
  if (!user) return null;

  const roles = user.roles ?? [];

  return (
    <div className="home-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {(user.firstName?.[0] ?? user.username?.[0] ?? "U").toUpperCase()}
          </div>

          <h1>Welcome Home!</h1>
          <p>You have successfully logged in.</p>
        </div>

        <div className="profile-details">
          <div className="detail">
            <span>Username :</span>
            <strong>{user.username || "N/A"}</strong>
          </div>

          <div className="detail">
            <span>First Name : </span>
            <strong>{user.firstName || "N/A"}</strong>
          </div>

          <div className="detail">
            <span>Last Name : </span>
            <strong>{user.lastName || "N/A"}</strong>
          </div>

          <div className="detail">
            <span>Email : </span>
            <strong>{user.email || "N/A"}</strong>
          </div>

          <div className="detail roles-detail">
            
            <div className="roles">
            <span>Role : </span>
              {roles.length > 0
                ? roles.map((role) => (
                    <span className="role-badge" key={role}>
                      {role}
                    </span>
                  ))
                : "No roles assigned"}
            </div>
          </div>
        </div>

        <button className="logout-button" onClick={keycloak.logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Home;

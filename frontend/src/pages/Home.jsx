
import { useEffect, useState } from "react";
import keycloak from "../services/keycloak";
import "../App.css";

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

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

  async function saveProfile(nextProfile) {
    setSaving(true);
    setProfileError("");
    try {
      setUser(await keycloak.saveProfile(nextProfile));
      setEditing(false);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    saveProfile({
      username: values.get("username"),
      firstName: values.get("firstName"),
      lastName: values.get("lastName"),
    });
  }

  return (
    <div className="home-container">
      <div className="profile-card">
        <div className="profile-header">
          

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

        {profileError && <p role="alert">{profileError}</p>}
        {editing ? (
          <form className="profile-form" onSubmit={handleSubmit}>
            <label>
              Username
              <input name="username" autoComplete="username" required maxLength={255} defaultValue={user.username} />
            </label>
            <label>
              First name
              <input name="firstName" autoComplete="given-name" maxLength={100} defaultValue={user.firstName} />
            </label>
            <label>
              Last name
              <input name="lastName" autoComplete="family-name" maxLength={100} defaultValue={user.lastName} />
            </label>
            <div className="profile-actions">
              <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
              <button type="button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-actions">
            <button type="button" disabled={saving} onClick={() => setEditing(true)}>
              Edit profile
            </button>
          </div>
        )}

        <button className="logout-button" onClick={keycloak.logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Home;

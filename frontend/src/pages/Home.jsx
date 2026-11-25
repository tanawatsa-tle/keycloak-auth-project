
import { useEffect, useState } from "react";
import keycloak from "../services/keycloak";
import AdminUsers from "./AdminUsers";
import "../App.css";

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [tokenStatus, setTokenStatus] = useState("");
  const [loadingToken, setLoadingToken] = useState(false);

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
  async function showToken() {
    setLoadingToken(true);
    setTokenStatus("");
    try {
      const { accessToken, claims } = await keycloak.getAccessToken();
      console.log("Access token:", accessToken);
      console.log("Decoded JWT payload:", claims);
      setTokenStatus("Access token and decoded JWT logged to the browser console.");
    } catch (err) {
      setTokenStatus(err.message);
    } finally {
      setLoadingToken(false);
    }
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>My Application</h1>
        <span className="status-badge">Authenticated</span>
      </header>
      <section className="dashboard-section profile-summary" aria-label="Signed-in user">
        <span className="profile-avatar" aria-hidden="true">{(user.username?.[0] ?? "U").toUpperCase()}</span>
        <div>   
          <h2>Welcome, {user.username || "user"}</h2>
          <p>{user.email || "No email on file"}</p>
        </div>
        {user.isAdmin && <span className="status-badge">ADMIN</span>}
      </section>

      <section className="dashboard-section" aria-labelledby="authentication-heading">
        <h2 id="authentication-heading">Authentication Information</h2>
        <dl className="info-list">
          <div><dt>Login status</dt><dd>Authenticated</dd></div>
          <div><dt>Identity provider</dt><dd>Keycloak</dd></div>
          <div><dt>Token type</dt><dd>Bearer</dd></div>
          <div>
            <dt>User role</dt>
            <dd className="role-list">
              {roles.length ? roles.map((role) => <span className="role-badge" key={role}>{role}</span>) : "No roles assigned"}
            </dd>
          </div>
        </dl>
        <div className="profile-actions">
          <button type="button" disabled={loadingToken} onClick={showToken}>Log Access Token &amp; JWT</button>
          <button type="button" onClick={keycloak.logout}>Logout</button>
        </div>
        {tokenStatus && <p role="status">{tokenStatus}</p>}
      </section>

      <section className="dashboard-section" aria-labelledby="profile-heading">
        <div className="section-heading">
          <h2 id="profile-heading">Profile</h2>
          {!editing && <button className="primary-button" type="button" onClick={() => {
            setProfileError("");
            setEditing(true);
          }}>Edit profile</button>}
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
              <button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
              <button type="button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <dl className="info-list">
            <div><dt>Username</dt><dd>{user.username || "—"}</dd></div>
            <div><dt>First name</dt><dd>{user.firstName || "—"}</dd></div>
            <div><dt>Last name</dt><dd>{user.lastName || "—"}</dd></div>
            <div><dt>Email</dt><dd>{user.email || "—"}</dd></div>
          </dl>
        )}
      </section>

      {user.isAdmin && <AdminUsers currentUserId={user.id} />}
    </main>
  );
}

export default Home;

import { useEffect, useState } from "react";
import keycloak from "../services/keycloak";

function AdminUsers({ currentUserId }) {
  const [page, setPage] = useState({ users: [], hasNext: false });
  const [first, setFirst] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    keycloak.listUsers(first).then((result) => {
      if (active) setPage(result);
    }).catch((err) => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [first, revision]);

  function loadPage(offset) {
    setError("");
    setLoading(true);
    setFirst(offset);
    setRevision((value) => value + 1);
  }

  async function changeUsers(action, offset) {
    setSaving(true);
    setError("");
    try {
      await action();
      setAdding(false);
      loadPage(offset);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addUser(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    changeUsers(() => keycloak.createUser(fields), 0);
  }

  function deleteUser(user) {
    if (!window.confirm(`Delete ${user.username} from Keycloak?`)) return;
    const offset = page.users.length === 1 ? Math.max(0, first - 20) : first;
    changeUsers(() => keycloak.deleteUser(user.id), offset);
  }

  return (
    <section className="dashboard-section" aria-labelledby="users-heading">
      <div className="section-heading">
        <h2 id="users-heading">Users</h2>
        {!adding && <button className="primary-button" onClick={() => setAdding(true)}>Add user</button>}
      </div>
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {adding && (
        <form className="profile-form" onSubmit={addUser}>
          <label>Username<input name="username" maxLength={255} required /></label>
          <label>First name<input name="firstName" maxLength={100} required /></label>
          <label>Last name<input name="lastName" maxLength={100} required /></label>
          <label>Email<input name="email" type="email" maxLength={254} required /></label>
          <label>Temporary password<input name="password" type="password" autoComplete="new-password" maxLength={256} required /></label>
          <div className="profile-actions">
            <button className="primary-button" disabled={saving} type="submit">Create user</button>
            <button disabled={saving} type="button" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
      {loading ? <p role="status">Loading users…</p> : (
        <>
          {page.users.length === 0 ? <p>No users to display.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Username</th><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Actions</th></tr></thead>
                <tbody>
                  {page.users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</td>
                      <td>{user.email || "—"}</td>
                      <td>{user.id === currentUserId ? "You" : (
                        <button className="delete-button" disabled={saving} onClick={() => deleteUser(user)}
                          aria-label={`Delete ${user.username}`}>Delete</button>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="profile-actions">
            {first > 0 && <button disabled={saving} onClick={() => loadPage(Math.max(0, first - 20))}>Previous</button>}
            {page.hasNext && <button disabled={saving} onClick={() => loadPage(first + 20)}>Next</button>}
          </div>
        </>
      )}
    </section>
  );
}

export default AdminUsers;

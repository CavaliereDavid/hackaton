import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Person = {
  id: string;
  displayName: string;
  status: string;
  avatarUrl?: string | null;
};

export function InnerCircleManagePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await api<{ people: Person[] }>("/v1/inner-circle");
    setPeople(res.people);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/v1/inner-circle", {
        method: "POST",
        body: JSON.stringify({ displayName: name }),
      });
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onRemove(id: string) {
    await api(`/v1/inner-circle/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="manage-page">
      <header className="manage-page__header">
        <h1>Inner circle</h1>
        <Link to="/">Back to chat</Link>
      </header>
      <p className="manage-page__hint">Curate up to 10 close people for dead-time talk.</p>
      <form className="manage-form" onSubmit={(e) => void onAdd(e)}>
        <input
          className="talk-sheet__input"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />
        <md-filled-button type="submit">Add</md-filled-button>
      </form>
      {error ? <p className="chat-error">{error}</p> : null}
      {people.length === 0 ? (
        <p className="ig-empty">No one yet — add someone above.</p>
      ) : (
        <ul className="manage-list">
          {people.map((p) => (
            <li key={p.id} className="manage-list__item">
              <span>{p.displayName}</span>
              <md-text-button type="button" onClick={() => void onRemove(p.id)}>
                Remove
              </md-text-button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

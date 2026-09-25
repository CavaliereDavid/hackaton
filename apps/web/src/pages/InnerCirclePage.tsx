import { useEffect, useState, type FormEvent } from "react";
import { InnerCircleEmpty, InnerCircleList } from "../components/InnerCircleList";
import { api } from "../lib/api";

type Person = { id: string; displayName: string; status: string };

export function InnerCirclePage() {
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
    <div className="stack">
      <h1 className="brand">Inner circle</h1>
      <p>Curate up to 10 close people for dead-time talk.</p>
      <section className="panel stack">
        <form className="row" onSubmit={(e) => void onAdd(e)}>
          <input
            className="field"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
          />
          <button type="submit" className="btn">
            Add
          </button>
        </form>
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        {people.length === 0 ? (
          <InnerCircleEmpty />
        ) : (
          <>
            <InnerCircleList people={people} onSelect={() => undefined} />
            <ul style={{ listStyle: "none", padding: 0 }}>
              {people.map((p) => (
                <li key={p.id} className="row">
                  <span>{p.displayName}</span>
                  <button type="button" className="btn secondary" onClick={() => void onRemove(p.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

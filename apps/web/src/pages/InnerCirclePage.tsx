import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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
    <div className="sanctuary" style={{ justifyContent: "flex-start", gap: "1.5rem" }}>
      <div className="sanctuary__glow" />
      <header className="sanctuary__header">
        <div className="sanctuary__brand">
          <Link to="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
            Himalaya
          </Link>
          <span aria-hidden="true">·</span>
          <span className="sanctuary__tag">Il Cerchio</span>
        </div>
        <Link to="/" className="btn secondary">
          Torna al santuario
        </Link>
      </header>

      <main className="sanctuary__main" style={{ alignItems: "stretch", textAlign: "left", width: "100%", maxWidth: "36rem" }}>
        <div className="sanctuary__quote" style={{ padding: 0, textAlign: "left" }}>
          <h1 className="sanctuary__title" style={{ fontSize: "2rem" }}>
            Il Cerchio degli Affetti
          </h1>
          <p className="sanctuary__subtitle" style={{ marginLeft: 0 }}>
            Fino a 10 persone care per il tempo morto del calcolo.
          </p>
        </div>

        <section className="panel stack">
          <form className="row" onSubmit={(e) => void onAdd(e)}>
            <input
              className="field"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
            <button type="submit" className="btn">
              Aggiungi
            </button>
          </form>
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
          {people.length === 0 ? (
            <InnerCircleEmpty />
          ) : (
            <>
              <InnerCircleList people={people} onSelect={() => undefined} />
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {people.map((p) => (
                  <li key={p.id} className="row" style={{ justifyContent: "space-between" }}>
                    <span>{p.displayName}</span>
                    <button type="button" className="btn secondary" onClick={() => void onRemove(p.id)}>
                      Rimuovi
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

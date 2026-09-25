type Person = { id: string; displayName: string; status: string };

export function InnerCircleList({
  people,
  onSelect,
}: {
  people: Person[];
  onSelect: (person: Person) => void;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
      {people.map((p) => (
        <li key={p.id} className="row">
          <button type="button" className="btn secondary" onClick={() => onSelect(p)}>
            {p.displayName}
          </button>
          <span className="muted">{p.status}</span>
        </li>
      ))}
    </ul>
  );
}

export function InnerCircleEmpty() {
  return (
    <p className="muted">
      Il cerchio è vuoto. Aggiungi qualcuno per usare il tempo morto dell&apos;agente.
    </p>
  );
}

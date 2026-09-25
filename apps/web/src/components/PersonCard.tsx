import type { PersonLite } from "./StoriesStrip";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  person: PersonLite;
  onSelect: (person: PersonLite) => void;
};

export function PersonCard({ person, onSelect }: Props) {
  return (
    <article className="person-card">
      <button type="button" className="person-card__hit" onClick={() => onSelect(person)}>
        <span className="person-card__avatar" aria-hidden>
          {person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : initials(person.displayName)}
        </span>
        <span className="person-card__meta">
          <strong>{person.displayName}</strong>
          <span className="person-card__status">{person.status ?? "available"}</span>
        </span>
      </button>
    </article>
  );
}

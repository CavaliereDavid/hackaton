export type PersonLite = {
  id: string;
  displayName: string;
  status?: string;
  avatarUrl?: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  people: PersonLite[];
  onSelect: (person: PersonLite) => void;
};

export function StoriesStrip({ people, onSelect }: Props) {
  if (people.length === 0) return null;
  return (
    <div className="stories-strip" role="list" aria-label="Inner circle stories">
      {people.map((p) => (
        <button
          key={p.id}
          type="button"
          className="story-ring"
          role="listitem"
          onClick={() => onSelect(p)}
        >
          <span className="story-ring__avatar" aria-hidden>
            {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : initials(p.displayName)}
          </span>
          <span className="story-ring__name">{p.displayName.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}

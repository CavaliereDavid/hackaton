import { PersonCard } from "./PersonCard";
import type { PersonLite } from "./StoriesStrip";

type Props = {
  people: PersonLite[];
  onSelect: (person: PersonLite) => void;
};

export function InnerCircleFeed({ people, onSelect }: Props) {
  return (
    <div className="inner-feed" role="feed" aria-label="Inner circle">
      {people.map((p) => (
        <PersonCard key={p.id} person={p} onSelect={onSelect} />
      ))}
    </div>
  );
}

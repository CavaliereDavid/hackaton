import { api } from "../lib/api";

export function MeetStubButton({
  personId,
  talkSessionId,
}: {
  personId: string;
  talkSessionId?: string | null;
}) {
  return (
    <button
      type="button"
      className="btn secondary"
      onClick={async () => {
        const stub = await api<{ launchUrl: string }>("/v1/meet/stub", {
          method: "POST",
          body: JSON.stringify({ personId, talkSessionId: talkSessionId ?? undefined }),
        });
        window.alert(`Meet stub opened:\n${stub.launchUrl}`);
      }}
    >
      Start meet
    </button>
  );
}

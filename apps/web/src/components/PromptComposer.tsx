import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type Props = {
  disabled?: boolean;
  onSubmitPrompt: (prompt: string) => void | Promise<void>;
};

export function PromptComposer({ disabled, onSubmitPrompt }: Props) {
  const [value, setValue] = useState("");
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    await onSubmitPrompt(trimmed);
    fieldRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  function onForm(e: FormEvent) {
    e.preventDefault();
    void submit();
  }

  return (
    <form className="prompt-composer" onSubmit={onForm}>
      <textarea
        ref={fieldRef}
        className="prompt-composer__field"
        rows={2}
        placeholder="Message Dead Time…"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Prompt"
      />
      <md-filled-button type="submit" disabled={disabled || !value.trim()} aria-label="Send">
        Send
      </md-filled-button>
    </form>
  );
}

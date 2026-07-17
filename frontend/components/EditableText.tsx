"use client";

import { useState } from "react";

type EditableTextProps = {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
};

export function EditableText({
  value,
  onCommit,
  className = "",
  placeholder,
  multiline = false,
}: EditableTextProps) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  function startEditing() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (draft !== value) {
      onCommit(draft);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div
        onClick={startEditing}
        className={`min-h-[1.5rem] cursor-text whitespace-pre-wrap ${className}`}
      >
        {value || (
          <span className="italic text-gray-text">{placeholder}</span>
        )}
      </div>
    );
  }

  if (multiline) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
        rows={2}
        className={`w-full resize-none rounded border border-primary-blue px-1 py-0.5 outline-none ${className}`}
      />
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") cancel();
      }}
      className={`w-full rounded border border-primary-blue px-1 py-0.5 outline-none ${className}`}
    />
  );
}

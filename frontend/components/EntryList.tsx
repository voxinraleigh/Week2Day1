"use client";

import { useState } from "react";
import { EditableText } from "./EditableText";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Entry } from "@/lib/types";

type EntryListProps = {
  entries: Entry[];
  onChange: (entries: Entry[]) => void;
};

export function EntryList({ entries, onChange }: EntryListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function updateEntry(id: string, text: string) {
    onChange(entries.map((e) => (e.id === id ? { ...e, text } : e)));
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }

  function addEntry() {
    onChange([...entries, { id: crypto.randomUUID(), text: "" }]);
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-1">
          <EditableText
            value={entry.text}
            onCommit={(text) => updateEntry(entry.id, text)}
            placeholder="New entry"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setPendingDeleteId(entry.id)}
            aria-label="Delete entry"
            className="text-gray-text hover:text-red-600"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="text-left text-xs font-medium text-primary-blue hover:underline"
      >
        + add
      </button>
      <ConfirmDialog
        open={pendingDeleteId !== null}
        message="Delete this entry?"
        onConfirm={() => {
          if (pendingDeleteId) removeEntry(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableText } from "./EditableText";
import { EntryList } from "./EntryList";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Account, Entry, Technology } from "@/lib/types";

type AccountRowProps = {
  account: Account;
  technologies: Technology[];
  pinnedTechnology?: Technology;
  gridTemplateColumns: string;
  onRenameAccount: (id: string, name: string) => void;
  onDeleteAccount: (id: string) => void;
  onCellChange: (accountId: string, techId: string, entries: Entry[]) => void;
};

export function AccountRow({
  account,
  technologies,
  pinnedTechnology,
  gridTemplateColumns,
  onRenameAccount,
  onDeleteAccount,
  onCellChange,
}: AccountRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridTemplateColumns,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid border-b border-zinc-200 bg-white ${
        isDragging ? "z-10 opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder account"
        className="flex cursor-grab items-center justify-center text-gray-text active:cursor-grabbing"
      >
        ⠿
      </button>
      <div className="flex items-center gap-1 border-l border-zinc-200 px-3 py-2 font-medium text-dark-navy">
        <EditableText
          value={account.name}
          onCommit={(v) => onRenameAccount(account.id, v)}
          placeholder="Account name"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          aria-label="Delete account"
          className="text-gray-text hover:text-red-600"
        >
          ×
        </button>
      </div>
      {technologies.map((tech) => (
        <div
          key={tech.id}
          className="border-l border-zinc-200 px-3 py-2 text-sm text-zinc-800"
        >
          <EntryList
            entries={account.cells[tech.id] ?? []}
            onChange={(entries) => onCellChange(account.id, tech.id, entries)}
          />
        </div>
      ))}
      <div />
      {pinnedTechnology && (
        <div className="border-l border-zinc-200 px-3 py-2 text-sm text-zinc-800">
          <EntryList
            entries={account.cells[pinnedTechnology.id] ?? []}
            onChange={(entries) =>
              onCellChange(account.id, pinnedTechnology.id, entries)
            }
          />
        </div>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        message={`Delete the "${account.name || "untitled"}" account? This removes the entire row.`}
        onConfirm={() => {
          onDeleteAccount(account.id);
          setConfirmingDelete(false);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}

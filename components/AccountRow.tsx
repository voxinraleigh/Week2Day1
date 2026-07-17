"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableText } from "./EditableText";
import type { Account } from "@/lib/board";

type AccountRowProps = {
  account: Account;
  technologies: string[];
  onRenameAccount: (id: string, name: string) => void;
  onCellChange: (id: string, techIndex: number, value: string) => void;
};

export function AccountRow({
  account,
  technologies,
  onRenameAccount,
  onCellChange,
}: AccountRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[40px_200px_repeat(10,minmax(140px,1fr))] border-b border-zinc-200 bg-white ${
        isDragging ? "z-10 opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-center text-gray-text active:cursor-grabbing"
        aria-label="Drag to reorder account"
        type="button"
      >
        ⠿
      </button>
      <div className="flex items-center border-l border-zinc-200 px-3 py-2 font-medium text-dark-navy">
        <EditableText
          value={account.name}
          onCommit={(v) => onRenameAccount(account.id, v)}
          placeholder="Account name"
        />
      </div>
      {technologies.map((_, i) => (
        <div
          key={i}
          className="border-l border-zinc-200 px-3 py-2 text-sm text-zinc-800"
        >
          <EditableText
            value={account.cells[String(i)] ?? ""}
            onCommit={(v) => onCellChange(account.id, i, v)}
            multiline
          />
        </div>
      ))}
    </div>
  );
}

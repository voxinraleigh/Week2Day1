"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableText } from "./EditableText";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Technology } from "@/lib/types";

type TechnologyHeaderProps = {
  technology: Technology;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSort: (id: string) => void;
};

export function TechnologyHeader({
  technology,
  onRename,
  onDelete,
  onSort,
}: TechnologyHeaderProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: technology.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onContextMenu={(e) => {
        e.preventDefault();
        onSort(technology.id);
      }}
      title="Right-click to sort by this column"
      className={`flex items-center gap-1 border-l border-zinc-200 px-3 py-2 text-sm font-semibold text-dark-navy ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder column"
        className="cursor-grab text-gray-text active:cursor-grabbing"
      >
        ⠿
      </button>
      <EditableText
        value={technology.name}
        onCommit={(name) => onRename(technology.id, name)}
        placeholder="New technology"
        className="flex-1"
      />
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label="Delete column"
        className="text-gray-text hover:text-red-600"
      >
        ×
      </button>
      <ConfirmDialog
        open={confirmingDelete}
        message={`Delete the "${technology.name || "untitled"}" column? This removes all its entries.`}
        onConfirm={() => {
          onDelete(technology.id);
          setConfirmingDelete(false);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}

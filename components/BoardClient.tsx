"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EditableText } from "./EditableText";
import { AccountRow } from "./AccountRow";
import type { Board } from "@/lib/board";

export function BoardClient({ initialBoard }: { initialBoard: Board }) {
  const router = useRouter();
  const [board, setBoard] = useState<Board>(initialBoard);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback((next: Board) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/board", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    }, 500);
  }, []);

  function updateBoard(updater: (prev: Board) => Board) {
    setBoard((prev) => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  function renameTechnology(index: number, name: string) {
    updateBoard((prev) => {
      const technologies = [...prev.technologies];
      technologies[index] = name;
      return { ...prev, technologies };
    });
  }

  function renameAccount(id: string, name: string) {
    updateBoard((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, name } : a)),
    }));
  }

  function changeCell(id: string, techIndex: number, value: string) {
    updateBoard((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === id
          ? { ...a, cells: { ...a.cells, [String(techIndex)]: value } }
          : a,
      ),
    }));
  }

  function addAccount() {
    updateBoard((prev) => ({
      ...prev,
      accounts: [...prev.accounts, { id: crypto.randomUUID(), name: "", cells: {} }],
    }));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateBoard((prev) => {
      const oldIndex = prev.accounts.findIndex((a) => a.id === active.id);
      const newIndex = prev.accounts.findIndex((a) => a.id === over.id);
      return { ...prev, accounts: arrayMove(prev.accounts, oldIndex, newIndex) };
    });
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-dark-navy">
          Account Heat Map
        </h1>
        <button
          onClick={handleLogout}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-gray-text hover:bg-zinc-100"
        >
          Sign out
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="inline-block min-w-full rounded-lg border border-zinc-200 bg-white">
          <div className="grid grid-cols-[40px_200px_repeat(10,minmax(140px,1fr))] border-b-2 border-zinc-300 bg-zinc-100">
            <div />
            <div className="px-3 py-2 text-sm font-semibold text-dark-navy">
              Account
            </div>
            {board.technologies.map((tech, i) => (
              <div
                key={i}
                className="border-l border-zinc-200 px-3 py-2 text-sm font-semibold text-dark-navy"
              >
                <EditableText value={tech} onCommit={(v) => renameTechnology(i, v)} />
              </div>
            ))}
          </div>

          <DndContext
            id="account-board"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={board.accounts.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {board.accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  technologies={board.technologies}
                  onRenameAccount={renameAccount}
                  onCellChange={changeCell}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            onClick={addAccount}
            className="w-full border-t border-zinc-200 px-3 py-3 text-left text-sm font-medium text-primary-blue hover:bg-zinc-50"
            type="button"
          >
            + Add account
          </button>
        </div>
      </div>
    </div>
  );
}

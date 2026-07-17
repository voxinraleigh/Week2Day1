"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EditableText } from "./EditableText";
import { TechnologyHeader } from "./TechnologyHeader";
import { AccountRow } from "./AccountRow";
import type { Board, Entry } from "@/lib/types";

export function BoardClient() {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/board").then((res) => {
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      res.json().then(setBoard);
    });
  }, [router]);

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
      if (!prev) return prev;
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  function renameTitle(title: string) {
    updateBoard((prev) => ({ ...prev, title }));
  }

  function renameTechnology(id: string, name: string) {
    updateBoard((prev) => ({
      ...prev,
      technologies: prev.technologies.map((t) =>
        t.id === id ? { ...t, name } : t,
      ),
    }));
  }

  function addTechnology() {
    updateBoard((prev) => {
      const normal = prev.technologies.filter((t) => !t.isNextSteps);
      const pinned = prev.technologies.filter((t) => t.isNextSteps);
      return {
        ...prev,
        technologies: [
          ...normal,
          { id: crypto.randomUUID(), name: "", isNextSteps: false },
          ...pinned,
        ],
      };
    });
  }

  function deleteTechnology(id: string) {
    updateBoard((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t.id !== id),
      accounts: prev.accounts.map((a) => {
        const cells = { ...a.cells };
        delete cells[id];
        return { ...a, cells };
      }),
    }));
  }

  function sortByTechnology(techId: string) {
    updateBoard((prev) => {
      const accounts = [...prev.accounts].sort((a, b) => {
        const aText = (a.cells[techId] ?? []).map((e) => e.text).join(", ");
        const bText = (b.cells[techId] ?? []).map((e) => e.text).join(", ");
        return aText.localeCompare(bText, undefined, { sensitivity: "base" });
      });
      return { ...prev, accounts };
    });
  }

  function renameAccount(id: string, name: string) {
    updateBoard((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, name } : a)),
    }));
  }

  function deleteAccount(id: string) {
    updateBoard((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  }

  function changeCell(accountId: string, techId: string, entries: Entry[]) {
    updateBoard((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === accountId
          ? { ...a, cells: { ...a.cells, [techId]: entries } }
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

  function handleRowDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateBoard((prev) => {
      const oldIndex = prev.accounts.findIndex((a) => a.id === active.id);
      const newIndex = prev.accounts.findIndex((a) => a.id === over.id);
      return { ...prev, accounts: arrayMove(prev.accounts, oldIndex, newIndex) };
    });
  }

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateBoard((prev) => {
      const normal = prev.technologies.filter((t) => !t.isNextSteps);
      const pinned = prev.technologies.filter((t) => t.isNextSteps);
      const oldIndex = normal.findIndex((t) => t.id === active.id);
      const newIndex = normal.findIndex((t) => t.id === over.id);
      return {
        ...prev,
        technologies: [...arrayMove(normal, oldIndex, newIndex), ...pinned],
      };
    });
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 text-gray-text">
        Loading…
      </div>
    );
  }

  const normalTechs = board.technologies.filter((t) => !t.isNextSteps);
  const pinnedTech = board.technologies.find((t) => t.isNextSteps);

  const gridTemplateColumns = `40px 200px repeat(${normalTechs.length}, minmax(140px, 1fr)) 48px minmax(140px, 1fr)`;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <EditableText
          value={board.title}
          onCommit={renameTitle}
          className="text-xl font-semibold text-dark-navy"
        />
        <button
          onClick={handleLogout}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-gray-text hover:bg-zinc-100"
        >
          Sign out
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="inline-block min-w-full rounded-lg border border-zinc-200 bg-white">
          <div
            className="grid border-b-2 border-zinc-300 bg-zinc-100"
            style={{ gridTemplateColumns }}
          >
            <div />
            <div className="px-3 py-2 text-sm font-semibold text-dark-navy">
              Account
            </div>
            <DndContext
              id="tech-columns"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
            >
              <SortableContext
                items={normalTechs.map((t) => t.id)}
                strategy={horizontalListSortingStrategy}
              >
                {normalTechs.map((tech) => (
                  <TechnologyHeader
                    key={tech.id}
                    technology={tech}
                    onRename={renameTechnology}
                    onDelete={deleteTechnology}
                    onSort={sortByTechnology}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button
              onClick={addTechnology}
              aria-label="Add column"
              title="Add column"
              type="button"
              className="flex items-center justify-center border-l border-zinc-200 text-primary-blue hover:bg-zinc-50"
            >
              +
            </button>
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                if (pinnedTech) sortByTechnology(pinnedTech.id);
              }}
              title="Right-click to sort by this column"
              className="border-l border-zinc-200 px-3 py-2 text-sm font-semibold text-dark-navy"
            >
              Next steps
            </div>
          </div>

          <DndContext
            id="account-board"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRowDragEnd}
          >
            <SortableContext
              items={board.accounts.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {board.accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  technologies={normalTechs}
                  pinnedTechnology={pinnedTech}
                  gridTemplateColumns={gridTemplateColumns}
                  onRenameAccount={renameAccount}
                  onDeleteAccount={deleteAccount}
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

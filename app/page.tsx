import { readBoard } from "@/lib/board";
import { BoardClient } from "@/components/BoardClient";

export default async function Home() {
  const board = await readBoard();
  return <BoardClient initialBoard={board} />;
}

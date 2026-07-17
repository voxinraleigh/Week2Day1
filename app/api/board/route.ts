import { NextRequest, NextResponse } from "next/server";
import { readBoard, writeBoard, type Board } from "@/lib/board";

export async function GET() {
  const board = await readBoard();
  return NextResponse.json(board);
}

export async function PUT(request: NextRequest) {
  const board = (await request.json()) as Board;
  await writeBoard(board);
  return NextResponse.json({ ok: true });
}

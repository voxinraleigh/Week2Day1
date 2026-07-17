import { promises as fs } from "fs";
import path from "path";

export type Account = {
  id: string;
  name: string;
  cells: Record<string, string>;
};

export type Board = {
  technologies: string[];
  accounts: Account[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "board.json");

const DEFAULT_TECHNOLOGIES = [
  "AI Tools",
  "AI Strategy",
  "Data Governance",
  "Cloud Infrastructure",
  "Security",
  "Analytics",
  "DevOps",
  "Integration",
  "Automation",
  "Compliance",
];

function seedBoard(): Board {
  return {
    technologies: [...DEFAULT_TECHNOLOGIES],
    accounts: [],
  };
}

export async function readBoard(): Promise<Board> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Board;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      const board = seedBoard();
      await writeBoard(board);
      return board;
    }
    throw err;
  }
}

export async function writeBoard(board: Board): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(board, null, 2), "utf-8");
}

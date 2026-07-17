export type Entry = { id: string; text: string };

export type Technology = { id: string; name: string; isNextSteps: boolean };

export type Account = {
  id: string;
  name: string;
  cells: Record<string, Entry[]>;
};

export type Board = {
  title: string;
  technologies: Technology[];
  accounts: Account[];
};

import idioms from '../assets/idiom/four.json';
import { produce } from 'immer';
import { generate } from 'randomstring';
import { create } from 'zustand';

interface Idiom {
  id: string;
  word: string;
  explanation: string;
  isComplete: boolean;
}

export function randomIdioms(length: number): Idiom[] {
  const res: Idiom[] = [];
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * idioms.length);
    res.push({ ...idioms[index], id: generate(5), isComplete: false });
  }
  return res;
}

interface IdiomsStore {
  idioms: Idiom[];
  randomIdioms: (size: number) => Idiom[];
  setCompete: (id: string) => void;
}

export const useIdiomsStore = create<IdiomsStore>((set) => ({
  idioms: [],
  randomIdioms: (size: number) => {
    const idioms = randomIdioms(size);
    set({ idioms: idioms });
    return idioms;
  },
  setCompete: (id: string) => {
    set(
      produce((state: IdiomsStore) => {
        const index = state.idioms.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.idioms[index].isComplete = true;
        }
      }),
    );
  },
}));

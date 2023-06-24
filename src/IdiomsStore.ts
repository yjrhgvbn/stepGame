import idioms from '../assets/Idiom/four.json';
import { getGenerateKey } from './utils';
import { produce } from 'immer';
import { create } from 'zustand';

export interface Idiom {
  key: string;
  words: IdiomWord[];
  explanation: string;
  isComplete: boolean;
}

export interface IdiomWord {
  text: string;
  key: string;
  isSeletd: boolean;
}

export function randomIdioms(length: number): Idiom[] {
  const { getKey } = getGenerateKey('$idiom_');
  const res: Idiom[] = [];
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * idioms.length);
    const words = idioms[index].word.split('').map((item) => ({
      text: item,
      key: getKey(),
      isSeletd: false,
    }));
    res.push({
      words,
      key: getKey(),
      explanation: idioms[index].explanation,
      isComplete: false,
    });
  }
  return res;
}

interface IdiomsStore {
  idioms: Idiom[];
  completeIdioms: Idiom[];
  randomIdioms: (size: number) => Idiom[];
  changeSelect: (id: string, isSeletd?: boolean) => { isComplete: boolean };
  clearSelect: () => void;
}

export const useIdiomsStore = create<IdiomsStore>((set) => ({
  idioms: [],
  completeIdioms: [],
  randomIdioms: (size: number) => {
    const idioms = randomIdioms(size);
    set({ idioms: idioms, completeIdioms: [] });
    return idioms;
  },
  changeSelect: (id: string, isSeletd = true) => {
    let res = { isComplete: false };
    set(
      produce((state: IdiomsStore) => {
        for (let i = 0; i < state.idioms.length; i++) {
          const idiom = state.idioms[i];
          for (let j = 0; j < idiom.words.length; j++) {
            const word = idiom.words[j];
            if (word.key === id) {
              word.isSeletd = isSeletd;
              if (idiom.words.every((item) => item.isSeletd)) {
                state.completeIdioms.push(idiom);
                state.idioms[i].isComplete = true;
                res = { isComplete: true };
              }
              return state;
            }
          }
        }
      }),
    );
    return res;
  },
  clearSelect() {
    set(
      produce((state: IdiomsStore) => {
        state.idioms.forEach((idiom) => {
          idiom.words.forEach((word) => {
            word.isSeletd = false;
          });
        });
      }),
    );
  },
}));

interface IdiomsAnimateStore {
  postion: { x: number; y: number };
  setPostion: (x: number, y: number) => void;
}

export const useIdiomsAnimateStore = create<IdiomsAnimateStore>((set) => ({
  postion: { x: 0, y: 0 },
  setPostion: (x: number, y: number) => set({ postion: { x, y } }),
}));

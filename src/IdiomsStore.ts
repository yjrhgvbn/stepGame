import idioms from '../assets/idiom/four.json';
import { getGenerateKey } from './utils';
import { produce } from 'immer';
import { create } from 'zustand';

interface Idiom {
  key: string;
  words: IdiomWord[];
  explanation: string;
}

interface IdiomWord {
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
    });
  }
  return res;
}

interface IdiomsStore {
  idioms: Idiom[];
  completeIdioms: Idiom[];
  randomIdioms: (size: number) => Idiom[];
  changeSelect: (id: string, isSeletd?: boolean) => { isComplete: boolean };
}

export const useIdiomsStore = create<IdiomsStore>((set) => ({
  idioms: [],
  completeIdioms: [],
  randomIdioms: (size: number) => {
    const idioms = randomIdioms(size);
    set({ idioms: idioms });
    return idioms;
  },
  changeSelect: (id: string, isSeletd = true) => {
    let res = { isComplete: false };
    set(
      produce((state: IdiomsStore) => {
        for (const idiom of state.idioms) {
          for (let i = 0; i < idiom.words.length; i++) {
            const word = idiom.words[i];
            if (word.key === id) {
              word.isSeletd = isSeletd;
              if (idiom.words.every((item) => item.isSeletd)) {
                state.completeIdioms.push(idiom);
                state.idioms.splice(i, 1);
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
}));

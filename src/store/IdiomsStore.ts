import idioms from '../../assets/Idiom/four.json';
import { getGenerateKey } from '../utils';
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
}

export function randomIdioms(length: number): Idiom[] {
  const { getKey } = getGenerateKey('$idiom_');
  const res: Idiom[] = [];
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * idioms.length);
    const words = idioms[index].word.split('').map((item) => ({
      text: item,
      key: getKey(),
      isSelected: false,
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

export interface IdiomsStore {
  idioms: Idiom[];
  selectIdiomKeys: string[];
  resetIdioms: (size: number) => Idiom[];
  changeSelect: (id: string, isSelected?: boolean) => void;
  clearSelect: () => void;
  /**
   * 提交选中，根据选中设置是否完成，只能提交一行
   */
  commitSelect: () => string[];
}

export const useIdiomsStore = create<IdiomsStore>((set, get) => ({
  selectIdiomKeys: [],
  idioms: [],
  resetIdioms: (size: number) => {
    const idioms = randomIdioms(size);
    set({ idioms: idioms });
    return idioms;
  },
  changeSelect: (idiomId: string, isSelected = true) => {
    const { idioms } = get();
    const isInIdioms = idioms.some((idiom) => idiom.words.some(({ key }) => key === idiomId));
    if (!isInIdioms) throw new Error('不在答案行中');
    set(
      produce((state: IdiomsStore) => {
        const inSelectedIndex = state.selectIdiomKeys.findIndex((k) => k === idiomId);
        if (isSelected) {
          if (inSelectedIndex === -1) state.selectIdiomKeys.push(idiomId);
        } else {
          if (inSelectedIndex !== -1) state.selectIdiomKeys.splice(inSelectedIndex, 1);
        }
      }),
    );
  },
  clearSelect() {
    set(
      produce((state: IdiomsStore) => {
        state.selectIdiomKeys = [];
      }),
    );
  },
  commitSelect: () => {
    let res: string[] = [];
    set(
      produce((state: IdiomsStore) => {
        const { idioms, selectIdiomKeys } = state;
        idioms.forEach((idiom) => {
          if (idiom.words.every(({ key }) => selectIdiomKeys.includes(key))) {
            idiom.isComplete = true;
            res = res.concat(idiom.words.map(({ key }) => key));
          }
        });
      }),
    );
    return res;
  },
}));

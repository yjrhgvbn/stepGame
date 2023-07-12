import { immerable, produce } from 'immer';
import { countBy, maxBy, sample, xorBy } from 'lodash';
import { create } from 'zustand';

export interface ConfigStore {
  gridLen: number;
  fullMatch: boolean;
  setGridLen: (len: number) => void;
  setFullMatch: (fullMatch: boolean) => void;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  gridLen: 4,
  fullMatch: false,
  setGridLen: (len: number) => {
    set({ gridLen: len });
  },
  setFullMatch: (fullMatch: boolean) => {
    set({ fullMatch });
  },
}));

export default useConfigStore;

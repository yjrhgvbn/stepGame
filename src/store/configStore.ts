import tangPoetryList from '../../assets/poetry/tang.json';
import { sample } from 'lodash';
import { create } from 'zustand';

// 30位二进制，最大是32，为了方便计算，取30
const MAX_BIT = 30;

const poetryProcess: number[] = JSON.parse(localStorage.getItem('poetryProcess') || '[]');
const poetrySizeMap = new Map<number, number[]>();

export function savePoetryComplete(id: number) {
  const index = Math.floor(id / MAX_BIT);
  if (poetryProcess.length < index) {
    poetryProcess.concat(new Array(index - poetryProcess.length).fill(0));
  }
  const binaryIndex = id % MAX_BIT;
  poetryProcess[index] = poetryProcess[index] | (1 << binaryIndex);
  localStorage.setItem('poetryProcess', JSON.stringify(poetryProcess));
  initPoetrySizeMap();
}

/**
 * 随机一首诗，默认长度为全局设置的长度
 */
export function randomPoetryBySize(size?: number) {
  ensurePoetryRemain();
  let answerLen = size || useConfigStore.getState().gridLen;
  const poetryIndexList = poetrySizeMap.get(answerLen);
  const index = sample(poetryIndexList);
  if (!index) {
    // 全部完成，返回第一首诗
    return tangPoetryList[0];
  }
  return tangPoetryList[index];
}

/**
 * 检查诗词是否已经完成
 */
function checkComplete(id: number) {
  const index = Math.floor(id / MAX_BIT);
  if (poetryProcess.length < index) {
    return false;
  }
  const binaryIndex = id % MAX_BIT;
  return (poetryProcess[index] & (1 << binaryIndex)) !== 0;
}

function ensurePoetryRemain() {
  const curGridLen = useConfigStore.getState().gridLen;
  const poetryIndexList = poetrySizeMap.get(curGridLen);
  if (!poetryIndexList || poetryIndexList.length === 0) {
    let newPoetryLen = 0;
    for (const [index, list] of poetrySizeMap.entries()) {
      if (list.length > 0) {
        newPoetryLen = index;
        break;
      }
    }
    if (newPoetryLen === 0) {
      useConfigStore.setState({ allComplete: true });
      return false;
    }
    useConfigStore.setState({ gridLen: newPoetryLen });
  }
  return true;
}

export interface ConfigStore {
  gridLen: number;
  fullMatch: boolean;
  ableGridLen: number[];
  allComplete: boolean;
  setGridLen: (len: number) => void;
  setFullMatch: (fullMatch: boolean) => void;
  setAbleGridLen: (len: number[]) => void;
  setAllComplete: (allComplete: boolean) => void;
}
export const useConfigStore = create<ConfigStore>((set, get) => ({
  ableGridLen: [4, 5, 6, 7, 8, 9, 10],
  gridLen: 4,
  fullMatch: false,
  allComplete: false,
  setGridLen: (len: number) => {
    set({ gridLen: len });
  },
  setFullMatch: (fullMatch: boolean) => {
    set({ fullMatch });
  },
  setAbleGridLen: (len: number[]) => {
    set({ ableGridLen: len });
  },
  setAllComplete: (allComplete: boolean) => {
    set({ allComplete });
  },
}));

function initPoetrySizeMap() {
  poetrySizeMap.clear();
  tangPoetryList.forEach((poetry, index) => {
    const size = poetry.answerLen;
    const id = poetry.id;
    if (checkComplete(id)) return;
    if (poetrySizeMap.has(size)) {
      poetrySizeMap.get(size)?.push(index);
    } else {
      poetrySizeMap.set(size, [index]);
    }
  });
  useConfigStore.setState({ ableGridLen: Array.from(poetrySizeMap.keys()).sort() });
  ensurePoetryRemain();
}
initPoetrySizeMap();

export default useConfigStore;

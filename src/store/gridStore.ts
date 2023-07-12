import { clearAnimate } from '../Animate';
import { randomChinese } from '../utils';
import { IdiomsStore, useIdiomsStore } from './IdiomsStore';
import { type Point, extendGrid, generateGrid, loopStartPoint, pickIdiomStartPoints } from './generateGrid';
import { PoetryStore, usePoetryStore } from './poetryStore';
import { clamp, remove } from 'lodash';
import { create } from 'zustand';

enum ResType {
  Idiom,
  Poetry,
  Random,
}

type PoetryPoint = {
  resId: string;
  resType: ResType | null;
  resIndex: number;
  isComplete: boolean;
  isSelected: boolean;
  next: PoetryPoint | null;
  prev: PoetryPoint | null;
  text: string;
} & Point;

function generatePointGrid(answerLen: number) {
  const answerLine = usePoetryStore.getState().resetPoetry();
  // TODO 可以指定生产步数
  answerLen = answerLine.characters.length - 2;
  const gridLen = clamp(Math.ceil(answerLen) + 2, 4, 10);
  const grid = generateGrid(gridLen, answerLen);
  const poetryGrid = extendGrid<PoetryPoint>(grid, () => ({
    resIndex: 0,
    resId: '',
    resType: null,
    isComplete: false,
    isSelected: false,
    text: '',
  })).map((row) => {
    if (!row[0].prev && row[0].isInStepPath) {
      loopStartPoint(row[0], (_, i) => ({
        resIndex: i,
        resId: answerLine.characters[i].key,
        resType: ResType.Poetry,
        text: answerLine.characters[i].text,
      }));
    }
    return row;
  });
  const [startPoints, resStartPoints] = pickIdiomStartPoints(poetryGrid);
  const idioms = useIdiomsStore.getState().resetIdioms(startPoints.length);
  startPoints.forEach((point, i) =>
    loopStartPoint(point, (_, j) => ({ resIndex: j, text: idioms[i].words[j].text, resType: ResType.Idiom, resId: idioms[i].words[j].key })),
  );
  resStartPoints.forEach((point) =>
    loopStartPoint(point, (p, j) => {
      if (p.resType) return;
      return { resIndex: j, text: randomChinese(), resType: ResType.Random };
    }),
  );
  return poetryGrid;
}

function pointLinkAnswerSelected(type: ResType, id: string, isSelect: boolean) {
  let targetStore: PoetryStore | IdiomsStore;
  if (type === ResType.Poetry) {
    targetStore = usePoetryStore.getState();
  } else if (type === ResType.Idiom) {
    targetStore = useIdiomsStore.getState();
  } else {
    return;
  }
  targetStore.changeSelect(id, isSelect);
  return targetStore.commitSelect();
}

interface GridStore {
  selectedPoints: PoetryPoint[];
  grid: PoetryPoint[][];
  changeSelect: (i: number, j: number, isSelected?: boolean) => void;
  clearSelect: () => void;
  restart: () => void;
}

export const useGridStore = create<GridStore>((set, get) => ({
  selectedPoints: [],
  grid: generatePointGrid(4),
  changeSelect: (i, j, isSelect = true) => {
    const { grid, selectedPoints } = get();
    const point = grid[i][j];
    point.isSelected = isSelect;
    const isDone = pointLinkAnswerSelected(point.resType!, point.resId, isSelect);
    if (isDone) {
      loopStartPoint(point, (p) => {
        remove(selectedPoints, (item) => item.resId === p.resId);
        p.isComplete = true;
      });
    } else {
      remove(selectedPoints, (item) => item.resId === point.resId);
      if (isSelect) selectedPoints.push(point);
    }
    set({ grid: [...grid], selectedPoints: [...selectedPoints, point] });
  },
  clearSelect: () => {
    const { grid } = get();
    grid.forEach((row) => row.forEach((point) => (point.isSelected = false)));
    usePoetryStore.getState().clearSelect();
    useIdiomsStore.getState().clearSelect();
    set({ grid: [...grid], selectedPoints: [] });
  },
  restart: () => {
    clearAnimate();
    get().clearSelect();
    set({ grid: generatePointGrid(4), selectedPoints: [] });
  },
}));

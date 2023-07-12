import { cloneDeep, sample } from 'lodash';

interface MoveStepPoint {
  dir: string;
  step: number;
  minStep: number;
  maxStep: number;
  fromPoint: number[];
  toPoint: number[];
}

export class Point {
  num: number;
  isInStepPath: boolean = false;
  x: number = 0;
  y: number = 0;
  prev: Point | null = null;
  next: Point | null = null;
  constructor(num: number, x: number, y: number, prev: Point | null = null, next: Point | null = null) {
    this.num = num;
    this.x = x;
    this.y = y;
    if (prev) this.prepend(prev);
    if (next) this.append(next);
  }
  setHead() {
    if (this.prev) this.prev.next = null;
    this.prev = null;
  }
  setTail() {
    if (this.next) this.next.prev = null;
    this.next = null;
  }
  append(point: Point) {
    this.next = point;
    point.prev = this;
  }
  prepend(point: Point) {
    this.prev = point;
    point.next = this;
  }
}

/**
 * 生成网格，确保最小步数为指定步数
 */
export function generateGrid(size: number, steps: number, minStep: number = 1, maxStep: number = 3) {
  let { grid, stepPoint } = tryGenerateGrid(size, size, steps, minStep, maxStep);
  if (!stepPoint || !grid) throw new Error('生成网格失败');
  return grid;
}

export function loopStartPoint<T extends Point>(startPoint: T, fn: (p: T, index: number) => Partial<T> | void) {
  let cur: T | null = startPoint;
  while (cur.prev) {
    cur = cur.prev as T;
  }
  let index = 0;
  while (cur) {
    const extendData = fn(cur, index);
    if (extendData) Object.assign(cur, extendData);
    cur = cur.next as T;
    index++;
  }
}

/**
 * 扩展网格类型，主要是为了保留指针指向
 */
export function extendGrid<T extends Point>(grid: Point[][], extend: (p: T, x: number, y: number) => Omit<T, keyof Point>) {
  grid.forEach((row, x) => {
    row.forEach((point, y) => {
      Object.assign(point, extend(point as T, x, y));
    });
  });
  return grid as T[][];
}

/**
 * 根据当前网格生成四字成语的起点
 */
export function pickIdiomStartPoints<T extends Point>(grid: T[][], minLeftPointSize = 0) {
  const allStartPoints: T[] = [];
  const len = grid.length;
  grid.forEach((row) => {
    row.forEach((point) => {
      if (!point.prev && !point.isInStepPath) {
        allStartPoints.push(point);
      }
    });
  });
  const startPoints: T[] = [];
  const queue: T[] = allStartPoints;
  while (queue.length) {
    const first = queue.shift()!;
    first.setHead();
    let cur: T | null = first;
    for (let i = 0; i < 3; i++) {
      if (cur?.next) cur = cur.next as T;
      else cur = null;
    }
    if (cur) {
      startPoints.push(first);
      if (cur.next) queue.push(cur.next as T);
      cur.setTail();
    }
  }
  while (len * len - startPoints.length * 4 < minLeftPointSize) {
    startPoints.splice(Math.floor(Math.random() * startPoints.length), 1);
  }
  const resStartPoints: T[] = [];
  grid.forEach((row) => {
    row.forEach((point) => {
      if (!point.prev && !startPoints.includes(point)) {
        resStartPoints.push(point);
      }
    });
  });
  return [startPoints, resStartPoints];
}

/**
 * 生成随机网格
 */
function tryGenerateGrid(rowLen: number, colLen: number, steps: number, minStep: number = 1, maxStep: number = 4) {
  const initGrid: number[][] = new Array(rowLen).fill(-1).map(() => new Array(colLen).fill(-1));
  const randomSteps = generateRandomSteps(rowLen, colLen, steps, minStep, maxStep);
  if (!randomSteps) throw new Error('生成随机步骤失败');
  const [grid, stepPoint] = initLinkGridAndSteps(initGrid, randomSteps.startPoint, randomSteps.moveList, minStep, maxStep);
  const resGrid = fillGridLinkWithLen(grid, steps, 4, minStep, maxStep);
  return {
    grid: resGrid,
    stepPoint,
  };
}

/**
 * 生成带指针的网格，同时完善步骤
 */
function initLinkGridAndSteps(grid: number[][], startPoint: number[], steps: MoveStep[], minStep = 1, maxStep = 4): [Point[][], MoveStepPoint[]] {
  const stepPoints: MoveStepPoint[] = [];
  const newGrid = grid.map((row, i) => {
    return row.map((col, j) => {
      return new Point(col, i, j);
    });
  });
  let [x, y] = startPoint;
  let prePoint: Point = newGrid[x][y];
  steps.forEach((stepItem) => {
    const { dir, step } = stepItem;
    if (dir === 'l') y -= step;
    if (dir === 'r') y += step;
    if (dir === 't') x -= step;
    if (dir === 'd') x += step;
    stepPoints.push({
      ...stepItem,
      fromPoint: cloneDeep([prePoint.x, prePoint.y]),
      toPoint: [x, y],
    });
    prePoint.isInStepPath = true;
    prePoint.num = step;
    prePoint.append(newGrid[x][y]);
    prePoint = newGrid[x][y];
  });
  prePoint.isInStepPath = true;
  prePoint.num = randomInt(minStep, maxStep);
  return [newGrid, stepPoints];
}

/**
 * 根据当前网格随机取位置生成链路，最大长度为len
 */
function fillGridLinkWithLen(grid: Point[][], steps: number, len = 4, minStep = 1, maxStep = 4) {
  const rowLen = grid.length;
  const colLen = grid[0].length;
  let prePoint: Point | null = null;
  let preCoordinate: number[] = [];
  let curLinkCount = 0;
  for (let i = 0; i < rowLen * colLen - steps - 2; ) {
    if (!prePoint || curLinkCount >= len) {
      const newCoordinate = pickUnmarkedPoint();

      if (!newCoordinate) throw new Error('生成网格失败');
      prePoint = grid[newCoordinate[0]][newCoordinate[1]];
      prePoint.num = randomInt(minStep, maxStep);
      preCoordinate = newCoordinate;
      curLinkCount = 1;
    } else {
      const newCoordinate = pickUnmarkedSidePoint(preCoordinate![0], preCoordinate![1]);
      if (!newCoordinate) {
        prePoint = null;
        curLinkCount = 0;
        continue;
      }
      const newPoint = grid[newCoordinate[0]][newCoordinate[1]];
      newPoint.num = randomInt(minStep, maxStep);
      prePoint.num = Math.abs(newCoordinate[0] - preCoordinate[0]) + Math.abs(newCoordinate[1] - preCoordinate[1]);
      prePoint.append(newPoint);
      prePoint = newPoint;
      preCoordinate = newCoordinate;
      curLinkCount++;
    }
    i++;
  }
  return grid;
  function pickUnmarkedSidePoint(x: number, y: number) {
    const dir = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    const queue: number[][] = [];
    for (let i = minStep; i <= maxStep; i++) {
      dir.forEach(([dx, dy]) => {
        const newX = x + dx * i;
        const newY = y + dy * i;
        if (newX >= 0 && newX < rowLen && newY >= 0 && newY < colLen && grid[newX][newY].num === -1) {
          queue.push([newX, newY]);
        }
      });
    }
    return sample(queue);
  }
  function pickUnmarkedPoint() {
    const queue: number[][] = [];
    for (let i = 0; i < rowLen; i++) {
      for (let j = 0; j < colLen; j++) {
        if (grid[i][j].num === -1) queue.push([i, j]);
      }
    }
    return sample(queue);
  }
}

type MoveStep = Omit<MoveStepPoint, 'toPoint' | 'fromPoint'>;

/**
 * 获取随机起点和终点，并生成移动步骤
 * @param grid  网格
 * @param steps  移动步骤
 * @param minStep  最小步长
 * @param maxStep  最大步长
 */
function generateRandomSteps(
  rowLen: number,
  colLen: number,
  steps: number,
  minStep: number = 2,
  maxStep: number = 4,
): { endPoint: number[]; startPoint: number[]; moveList: MoveStep[] } | undefined {
  if (steps < 2 || colLen < 2 || rowLen < 2) return;
  const maxRowIndex = rowLen - 1;
  const mexColIndex = colLen - 1;
  const getRowBoundWidth = getBoundWidthFn(maxRowIndex, minStep, maxStep);
  const getColumnBoundWidth = getBoundWidthFn(mexColIndex, minStep, maxStep);
  const startPoint = [randomInt(0, maxRowIndex - 1), 0];
  const moveList: MoveStep[] = [];
  const currentPoint = [...startPoint];
  const dirMap: Record<string, number> = {
    l: 0,
    r: 2,
    t: 4,
    d: 6,
  };
  for (let i = steps; i >= 0; ) {
    const rowBound = getRowBoundWidth(currentPoint[0]);
    const columnBound = getColumnBoundWidth(currentPoint[1]);
    const randomDirList: string[] = [];
    if (columnBound[1] > 0) randomDirList.push('l');
    if (columnBound[2] > 0) randomDirList.push('r');
    if (rowBound[1] > 0) randomDirList.push('t');
    if (rowBound[2] > 0) randomDirList.push('d');
    let randomDir = randomDirList[randomInt(0, randomDirList.length - 1)];
    let [realMinStep, realMaxStep] = [...columnBound, ...rowBound].slice(dirMap[randomDir], dirMap[randomDir] + 2);
    let step = randomInt(realMinStep, realMaxStep);
    // 如果距离右侧太远，就强制往右
    if (columnBound[2] > 0 && i * ((maxStep - minStep) / 2 + minStep) < mexColIndex - currentPoint[1]) {
      randomDir = 'r';
      // 不限制最远距离
      step = randomInt(realMinStep, maxStep);
    }
    // 禁止回跳
    if (moveList.length) {
      if (hasBackStep([moveList[moveList.length - 1], { dir: randomDir, step }])) {
        continue;
      }
    }
    moveList.push({
      dir: randomDir,
      step,
      minStep: realMinStep,
      maxStep: realMaxStep,
    });
    if (randomDir === 'l') currentPoint[1] -= step;
    if (randomDir === 'r') currentPoint[1] += step;
    if (randomDir === 't') currentPoint[0] -= step;
    if (randomDir === 'd') currentPoint[0] += step;
    i--;
  }
  let endPoint = [...currentPoint];
  // 距离尾列在两位以内, 尝试调整左右移动
  if (endPoint[1] !== mexColIndex) {
    endPoint = trySmallStepMove(moveList, endPoint, mexColIndex);
  }
  // 在默认的移动步骤上，大约80%的情况不需要递归
  if (endPoint[1] !== mexColIndex || hasBackStep(moveList) || !isCorrectSteps(moveList, maxRowIndex)) {
    return generateRandomSteps(rowLen, colLen, steps, minStep, maxStep);
  }
  return {
    startPoint,
    moveList,
    endPoint,
  };
}

/**
 * 尝试调整左右移动
 * @param moveList  移动步骤
 * @param currentPoint  当前坐标
 * @param columns  列数
 * @param maxDistance  最大距离
 */
function trySmallStepMove(moveList: MoveStep[], targetPoint: number[], columns: number, maxDistance: number = 2) {
  const currentPoint = [...targetPoint];
  const distance = columns - currentPoint[1];
  if (Math.abs(distance) <= maxDistance) {
    const matchIndexList: number[] = [];
    moveList.forEach(({ dir, step, minStep, maxStep }, index) => {
      // 在终点左边
      if (distance > 0) {
        if (dir === 'l' && step > minStep) matchIndexList.push(index);
        if (dir === 'r' && step < maxStep) matchIndexList.push(index);
      } else {
        if (dir === 'l' && step < maxStep) matchIndexList.push(index);
        if (dir === 'r' && step > minStep) matchIndexList.push(index);
      }
    });
    if (matchIndexList.length >= maxDistance) {
      let absDistance = Math.abs(distance);
      while (absDistance > 0 && matchIndexList.length) {
        const index = randomInt(0, matchIndexList.length - 1);
        const matchIndex = matchIndexList[index];
        matchIndexList.splice(index, 1);
        const { dir } = moveList[matchIndex];
        // 在终点左边
        if (distance > 0) {
          if (currentPoint[1] + 1 > columns || currentPoint[1] + 1 < 0) continue;
          if (dir === 'l') {
            moveList[matchIndex].step--;
            currentPoint[1]++;
          }
          if (dir === 'r') {
            moveList[matchIndex].step++;
            currentPoint[1]++;
          }
        } else {
          if (currentPoint[1] - 1 < 0 || currentPoint[1] - 1 > columns) continue;
          if (dir === 'l') {
            moveList[matchIndex].step++;
            currentPoint[1]--;
          }
          if (dir === 'r') {
            moveList[matchIndex].step--;
            currentPoint[1]--;
          }
        }
        absDistance--;
      }
    }
  }
  return currentPoint;
}

/**
 *  是否回跳
 * @param curStep  当前步数
 * @param curDir   当前方向
 * @param preStep  上一步数
 * @param preDir  上一方向
 * @returns
 */
function hasBackStep(stepList: { step: number; dir: string }[]) {
  if (stepList.length < 2) return false;
  let x = 0;
  let y = 0;
  const pathRecord: string[] = [`${x},${y}`];
  for (let i = 0; i < stepList.length; i++) {
    const { dir: curDir, step: curStep } = stepList[i];
    if (curDir === 'l') x -= curStep;
    if (curDir === 'r') x += curStep;
    if (curDir === 't') y -= curStep;
    if (curDir === 'd') y += curStep;
    const newStep = `${x},${y}`;
    if (pathRecord.includes(newStep)) return true;
    pathRecord.push(newStep);
  }
  return false;
}
/**
 *  判断步骤是否正确
 */
function isCorrectSteps(stepList: { step: number; dir: string }[], rowSize: number) {
  let sum = 0;
  for (let i = 0; i < stepList.length; i++) {
    const { step, dir } = stepList[i];
    if (dir === 'l') {
      sum -= step;
    } else if (dir === 'r') {
      sum += step;
    }
    if (sum < 0 || sum > rowSize) return false;
  }
  return true;
}

// 在指定范围内获取最大宽度
export function getBoundWidthFn(length: number, minStep: number = 2, maxStep: number = 4) {
  return function (position: number) {
    const leftMin = position < minStep ? 0 : minStep;
    const leftMax = position < maxStep ? (leftMin == 0 ? 0 : position) : maxStep;
    const rightMin = length - position >= minStep ? minStep : 0;
    const rightMax = length - position >= maxStep ? maxStep : rightMin === 0 ? 0 : length - position;
    return [leftMax, leftMin, rightMin, rightMax];
  };
}
function randomInt(num1: number, num2: number) {
  const min = Math.min(num1, num2);
  const max = Math.max(num1, num2);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

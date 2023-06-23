import { sample } from 'lodash';

interface MoveStep {
  dir: string;
  step: number;
  minStep: number;
  maxStep: number;
  point: number[];
}

export class Point {
  num: number;
  isPath: boolean = false;
  text: string = '';
  prev: Point | null = null;
  next: Point | null = null;
  constructor(num: number, prev: Point | null = null, next: Point | null = null) {
    this.num = num;
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
export function generateGrid(size: number, steps: number, minStep: number = 1, maxStep: number = 4) {
  let { grid, randownSteps } = tryGenerateGrid(size, steps, minStep, maxStep);
  // while (!randownSteps || !isMinStep(grid!, randownSteps.startPoint, randownSteps.endPoint, 4)) {
  //   ({ grid, randownSteps } = tryGenerateGrid(size, steps, minStep, maxStep));
  // }
  if (!randownSteps || !grid) throw new Error('生成网格失败');
  grid = applyStep(grid, randownSteps);
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
      if (!point.prev && !point.isPath) {
        allStartPoints.push(point);
      }
    });
  });
  const startPoints: T[] = [];
  const quene: T[] = allStartPoints;
  while (quene.length) {
    const first = quene.shift()!;
    first.setHead();
    let cur: T | null = first;
    for (let i = 0; i < 3; i++) {
      if (cur?.next) cur = cur.next as T;
      else cur = null;
    }
    if (cur) {
      startPoints.push(first);
      if (cur.next) quene.push(cur.next as T);
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
function tryGenerateGrid(size: number, steps: number, minStep: number = 1, maxStep: number = 4) {
  const linkGrid = randomGrid(size, minStep, maxStep);
  // TODO: 这里转化是没必要的，后来改成了生成链表，但是这里还是用的数字网格，后面有时间再改
  const grid = linkGrid.map((row) => row.map((item) => item.num));
  const randownSteps = generateRandownSteps(grid, steps, minStep, maxStep);
  if (!randownSteps) return { linkGrid };
  // fillEndPoint(grid, randownSteps.endPoint, maxStep);
  // grid[randownSteps.endPoint[0]][randownSteps.endPoint[1]] = 0;
  return {
    grid: linkGrid,
    randownSteps,
  };
}

/**
 *  根据步骤修改格子值， 并修改指针
 */
function applyStep(grid: Point[][], randownSteps: { startPoint: number[]; endPoint: number[]; moveList: MoveStep[] }) {
  const { endPoint, moveList } = randownSteps;
  const coordinates = [...moveList.map((item) => item.point), endPoint];
  let prePoint: Point | null = null;
  for (let i = 0; i < coordinates.length; i++) {
    const [x, y] = coordinates[i];
    const curPoint = grid[x][y];
    if (curPoint.prev) curPoint.prev.next = null;
    if (curPoint.next) curPoint.next.prev = null;
    if (i === 0) curPoint.setHead();
    curPoint.isPath = true;
    if (prePoint) prePoint.num = moveList[i - 1].step;
    if (prePoint) prePoint.append(curPoint);
    prePoint = curPoint;
  }
  prePoint?.setTail();
  return grid;
}
/**
 * 判断最小步数
 */
// function isMinStep(grid: Point[][], startPoint: number[], endPoint: number[], minStep: number) {
//   const { length: rowLength } = grid;
//   const { length: columnLength } = grid[0];
//   const queue: number[][] = [startPoint];
//   const marketGrid: boolean[][] = new Array(rowLength).fill([]).map(() => new Array(columnLength).fill(false));
//   marketGrid[startPoint[0]][startPoint[1]] = true;
//   for (let i = 0; i < minStep; i++) {
//     const len = queue.length;
//     for (let j = 0; j < len; j++) {
//       const [x, y] = queue.shift()!;
//       if (x === endPoint[0] && y === endPoint[1]) return false;
//       const { num: val } = grid[x][y];
//       if (x - val >= 0 && !marketGrid[x - val][y]) {
//         queue.push([x - val, y]);
//         marketGrid[x - val][y] = true;
//       }
//       if (x + val < rowLength && !marketGrid[x + val][y]) {
//         queue.push([x + val, y]);
//         marketGrid[x + val][y] = true;
//       }
//       if (y - val >= 0 && !marketGrid[x][y - val]) {
//         queue.push([x, y - val]);
//         marketGrid[x][y - val] = true;
//       }
//       if (y + val < columnLength && !marketGrid[x][y + val]) {
//         queue.push([x, y + val]);
//         marketGrid[x][y + val] = true;
//       }
//     }
//   }
//   return true;
// }

/**
 * 生产随机网格
 */
function randomGrid(size: number, minStep: number = 2, maxStep: number = 4) {
  const grid: Point[][] = new Array(size).fill([]).map(() => new Array(size).fill(null));
  let prePoint: Point | undefined;
  let preCoordinate: number[] = [];
  for (let i = 0; i < size * size; ) {
    if (!prePoint) {
      const newCoordinate = pickUnmarkPoint();
      if (!newCoordinate) throw new Error('生成网格失败');
      prePoint = new Point(randomInt(minStep, maxStep));
      preCoordinate = newCoordinate;
    } else {
      const newCoordinate = pickUnmarkSidePoint(preCoordinate![0], preCoordinate![1]);
      if (!newCoordinate) {
        prePoint = undefined;
        continue;
      }
      const newPoint = new Point(randomInt(minStep, maxStep), prePoint);
      prePoint.num = Math.abs(newCoordinate[0] - preCoordinate[0]) + Math.abs(newCoordinate[1] - preCoordinate[1]);
      prePoint = newPoint;
      preCoordinate = newCoordinate;
    }
    grid[preCoordinate![0]][preCoordinate![1]] = prePoint;
    i++;
  }
  return grid;

  function pickUnmarkSidePoint(x: number, y: number) {
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
        if (newX >= 0 && newX < size && newY >= 0 && newY < size && !grid[newX][newY]) {
          queue.push([newX, newY]);
        }
      });
    }
    return sample(queue);
  }
  function pickUnmarkPoint() {
    const queue: number[][] = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!grid[i][j]) queue.push([i, j]);
      }
    }
    return sample(queue);
  }
}

/**
 * 获取随机起点和终点，并生成移动步骤
 * @param grid  网格
 * @param steps  移动步骤
 * @param minStep  最小步长
 * @param maxStep  最大步长
 */
function generateRandownSteps(
  grid: number[][],
  steps: number,
  minStep: number = 2,
  maxStep: number = 4,
): { endPoint: number[]; startPoint: number[]; moveList: MoveStep[] } | undefined {
  const rows = grid.length - 1;
  const columns = grid[0].length - 1;
  if (steps < 2) return;
  if (columns < 2) return;
  const getRowBoundWidth = getBoundWidthFn(rows, minStep, maxStep);
  const getColumnBoundWidth = getBoundWidthFn(columns, minStep, maxStep);
  const startPoint = [randomInt(0, rows - 1), 0];
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
    if (columnBound[2] > 0 && i * ((maxStep - minStep) / 2 + minStep) < columns - currentPoint[1]) {
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
      point: [...currentPoint],
    });
    if (randomDir === 'l') currentPoint[1] -= step;
    if (randomDir === 'r') currentPoint[1] += step;
    if (randomDir === 't') currentPoint[0] -= step;
    if (randomDir === 'd') currentPoint[0] += step;
    i--;
  }
  let endPoint = [...currentPoint];
  // 距离尾列在两位以内, 尝试调整左右移动
  if (endPoint[1] !== columns) {
    endPoint = trySmallStepMove(moveList, endPoint, columns);
  }
  // 在默认的移动步骤上，大约80%的情况不需要递归
  if (endPoint[1] !== columns || hasBackStep(moveList) || !isCorrectSteps(moveList, rows)) {
    return generateRandownSteps(grid, steps, minStep, maxStep);
  }
  applySetps(grid, moveList, startPoint);
  return {
    startPoint,
    moveList,
    endPoint,
  };
}

/**
 * 插入grip，并增加移动点
 */
function applySetps(grid: number[][], steps: MoveStep[], startPoint: number[]) {
  const currentPoint = [...startPoint];
  steps.forEach(({ dir, step }, index) => {
    grid[currentPoint[0]!][currentPoint[1]] = step;
    steps[index].point = [...currentPoint];
    if (dir === 'l') currentPoint[1] -= step;
    if (dir === 'r') currentPoint[1] += step;
    if (dir === 't') currentPoint[0] -= step;
    if (dir === 'd') currentPoint[0] += step;
  });
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
function hasBackStep(setpList: { step: number; dir: string }[]) {
  if (setpList.length < 2) return false;
  let { dir: preDir, step: preStep } = setpList[0];
  for (let i = 1; i < setpList.length; i++) {
    const { dir: curDir, step: curStep } = setpList[i];
    if (
      curStep === preStep &&
      ((preDir === 'r' && curDir === 'l') ||
        (preDir === 'l' && curDir === 'r') ||
        (preDir === 't' && curDir === 'd') ||
        (preDir === 'd' && curDir === 't'))
    ) {
      return true;
    }
    preDir = curDir;
    preStep = curStep;
  }
  return false;
}
/**
 *  判断步骤是否正确
 */
function isCorrectSteps(setpList: { step: number; dir: string }[], rowSize: number) {
  let sum = 0;
  for (let i = 0; i < setpList.length; i++) {
    const { step, dir } = setpList[i];
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
  return function (postion: number) {
    const leftMin = postion < minStep ? 0 : minStep;
    const leftMax = postion < maxStep ? (leftMin == 0 ? 0 : postion) : maxStep;
    const rightMin = length - postion >= minStep ? minStep : 0;
    const rightMax = length - postion >= maxStep ? maxStep : rightMin === 0 ? 0 : length - postion;
    return [leftMax, leftMin, rightMin, rightMax];
  };
}
function randomInt(num1: number, num2: number) {
  const min = Math.min(num1, num2);
  const max = Math.max(num1, num2);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

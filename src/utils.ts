interface MoveStep {
  dir: string;
  step: number;
  minStep: number;
  maxStep: number;
  point: number[];
}

export interface Grid {
  num: number;
  isStart: boolean;
  isEnd: boolean;
  isPath: boolean;
  pathNum: number;
}

/**
 * 生成网格，确保最小步数为指定步数
 */
export function generateGrid(size: number, steps: number, minStep: number = 1, maxStep: number = 4) {
  let { grid, randownSteps } = tryGenerateGrid(size, steps, minStep, maxStep);
  while (!randownSteps || !isMinStep(grid, randownSteps.startPoint, randownSteps.endPoint, 4)) {
    ({ grid, randownSteps } = tryGenerateGrid(size, steps, minStep, maxStep));
  }
  if (!randownSteps) throw new Error('生成网格失败');
  const res: Grid[][] = grid.map((row, rowIndex) =>
    row.map((num, columnIndex) => {
      const isStart = randownSteps!.startPoint[0] === rowIndex && randownSteps!.startPoint[1] === columnIndex;
      const isEnd = randownSteps!.endPoint[0] === rowIndex && randownSteps!.endPoint[1] === columnIndex;
      return {
        num,
        isStart,
        isEnd,
        isPath: false,
        pathNum: 0,
      };
    }),
  );
  res[randownSteps.startPoint[0]][randownSteps.startPoint[1]].isPath = true;
  res[randownSteps.startPoint[0]][randownSteps.startPoint[1]].pathNum = 0;
  randownSteps.moveList.forEach((moveStep, i) => {
    const [x, y] = moveStep.point;
    res[x][y].isPath = true;
    res[x][y].pathNum = i + 1;
  });
  return res;
}

/**
 * 生成随机网格，可能比指定步数少，可能要重复多次
 */
function tryGenerateGrid(size: number, steps: number, minStep: number = 1, maxStep: number = 4) {
  const grid = randomGrid(size, minStep, maxStep);
  const randownSteps = generateRandownSteps(grid, steps, minStep, maxStep);
  if (!randownSteps) return { grid };
  fillEndPoint(grid, randownSteps.endPoint, maxStep);
  grid[randownSteps.endPoint[0]][randownSteps.endPoint[1]] = 0;
  return {
    grid,
    randownSteps,
  };
}

/**
 * 判断最小步数
 */
function isMinStep(grid: number[][], startPoint: number[], endPoint: number[], minStep: number) {
  const { length: rowLength } = grid;
  const { length: columnLength } = grid[0];
  const queue: number[][] = [startPoint];
  const marketGrid: boolean[][] = new Array(rowLength).fill([]).map(() => new Array(columnLength).fill(false));
  marketGrid[startPoint[0]][startPoint[1]] = true;
  for (let i = 0; i < minStep; i++) {
    const len = queue.length;
    for (let j = 0; j < len; j++) {
      const [x, y] = queue.shift()!;
      if (x === endPoint[0] && y === endPoint[1]) return false;
      const val = grid[x][y];
      if (x - val >= 0 && !marketGrid[x - val][y]) {
        queue.push([x - val, y]);
        marketGrid[x - val][y] = true;
      }
      if (x + val < rowLength && !marketGrid[x + val][y]) {
        queue.push([x + val, y]);
        marketGrid[x + val][y] = true;
      }
      if (y - val >= 0 && !marketGrid[x][y - val]) {
        queue.push([x, y - val]);
        marketGrid[x][y - val] = true;
      }
      if (y + val < columnLength && !marketGrid[x][y + val]) {
        queue.push([x, y + val]);
        marketGrid[x][y + val] = true;
      }
    }
  }
  return true;
}

/**
 * 填充终点,终点两边都可达
 */
function fillEndPoint(grid: number[][], endPoint: number[], maxStep: number) {
  for (let i = 1; i <= maxStep; i++) {
    const topX = endPoint[0] - i;
    const bottomX = endPoint[0] + i;
    const leftY = endPoint[1] - i;
    if (topX >= 0) grid[topX][endPoint[1]] = i;
    if (bottomX < grid.length) grid[bottomX][endPoint[1]] = i;
    if (leftY >= 0) grid[endPoint[0]][leftY] = i;
  }
}

/**
 * 生产随机网格
 */
function randomGrid(size: number, minStep: number = 2, maxStep: number = 4) {
  const grid: number[][] = [];
  for (let i = 0; i < size; i++) {
    grid.push([]);
    for (let j = 0; j < size; j++) {
      grid[i].push(randomInt(minStep, maxStep));
    }
  }
  return grid;
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
  if (endPoint[1] !== columns || hasBackStep(moveList)) {
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
          if (currentPoint[1] + 1 > columns) continue;
          if (dir === 'l') {
            moveList[matchIndex].step--;
            currentPoint[1]++;
          }
          if (dir === 'r') {
            moveList[matchIndex].step++;
            currentPoint[1]++;
          }
        } else {
          if (currentPoint[1] - 1 < 0) continue;
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

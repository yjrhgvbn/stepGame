import { Point, generateGrid, getBoundWidthFn, pickIdiomStartPoints } from '../generateGrid';
import { clamp } from 'lodash';
import { expect, test } from 'vitest';

test('getBoundWidthFn', () => {
  expect(getBoundWidthFn(10, 2, 4)(10)).toMatchObject([4, 2, 0, 0]);
  expect(getBoundWidthFn(10, 2, 4)(9)).toMatchObject([4, 2, 0, 0]);
  expect(getBoundWidthFn(10, 2, 4)(8)).toMatchObject([4, 2, 2, 2]);
  expect(getBoundWidthFn(10, 2, 4)(7)).toMatchObject([4, 2, 2, 3]);
  expect(getBoundWidthFn(10, 2, 4)(5)).toMatchObject([4, 2, 2, 4]);
  expect(getBoundWidthFn(10, 2, 4)(4)).toMatchObject([4, 2, 2, 4]);
  expect(getBoundWidthFn(10, 2, 4)(3)).toMatchObject([3, 2, 2, 4]);
  expect(getBoundWidthFn(10, 2, 4)(2)).toMatchObject([2, 2, 2, 4]);
  expect(getBoundWidthFn(10, 2, 4)(1)).toMatchObject([0, 0, 2, 4]);
  expect(getBoundWidthFn(10, 2, 4)(0)).toMatchObject([0, 0, 2, 4]);
  expect(getBoundWidthFn(1, 2, 4)(0)).toMatchObject([0, 0, 0, 0]);
});

function testGrid(grid: Point[][], gridLen: number) {
  const gridWithCoordinate = grid.map((row, x) =>
    row.map((point: any, y) => {
      point.x = x;
      point.y = y;
      return point;
    }),
  );
  const res = new Array(gridLen).fill([]).map(() => new Array(gridLen).fill(true));
  const prevRes = new Array(gridLen).fill([]).map(() => new Array(gridLen).fill(false));
  gridWithCoordinate.forEach((row) => {
    row.forEach((point: any) => {
      if (!point.prev) {
        let cur = point;
        while (cur) {
          expect(prevRes[cur.x][cur.y]).toBe(false);
          prevRes[cur.x][cur.y] = true;
          const pre = cur;
          cur = cur.next;
          if (cur) {
            expect(Math.abs(cur.x - pre.x) + Math.abs(cur.y - pre.y)).toBe(pre.num);
          }
        }
      }
    });
  });
  const nextRes = new Array(gridLen).fill([]).map(() => new Array(gridLen).fill(false));
  gridWithCoordinate.forEach((row) => {
    row.forEach((point: any) => {
      if (!point.next) {
        let cur = point;
        while (cur) {
          expect(nextRes[cur.x][cur.y]).toBe(false);
          nextRes[cur.x][cur.y] = true;
          const pre = cur;
          cur = cur.prev;
          if (cur) {
            expect(Math.abs(cur.x - pre.x) + Math.abs(cur.y - pre.y)).toBe(cur.num);
          }
        }
      }
    });
  });
  expect(nextRes).toMatchObject(res);
}

test('generateGrid', () => {
  for (let i = 3; i < 10; i++) {
    for (let _ = 0; _ < 100; _++) {
      const gridLen = clamp(Math.ceil(i * 1.5), 4, 10);
      const grid = generateGrid(gridLen, i);
      testGrid(grid, gridLen);
    }
  }
});

test('pickIdiomStartPoints', () => {
  for (let i = 3; i < 10; i++) {
    for (let _ = 0; _ < 100; _++) {
      const gridLen = clamp(Math.ceil(i * 1.5), 4, 10);
      const grid = generateGrid(gridLen, i);
      const [startPoints, resStartPoints] = pickIdiomStartPoints(grid);
      testGrid(grid, gridLen);
      const res = new Array(gridLen).fill([]).map(() => new Array(gridLen).fill(true));
      const mark = new Array(gridLen).fill([]).map(() => new Array(gridLen).fill(false));
      startPoints.concat(resStartPoints).forEach((point: any) => {
        expect(point.prev).toBe(null);
        let cur = point;
        while (cur) {
          expect(mark[cur.x][cur.y]).toBe(false);
          mark[cur.x][cur.y] = true;
          cur = cur.next;
        }
      });
      expect(mark).toMatchObject(res);
    }
  }
});

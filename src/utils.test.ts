import { getBoundWidthFn } from './utils';
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

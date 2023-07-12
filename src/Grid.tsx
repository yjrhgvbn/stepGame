import { Card } from '../components/ui/card';
import { setAnimateFrom } from './Animate';
import { type Point } from './store/generateGrid';
import { useGridStore } from './store/gridStore';
import classNames from 'classnames';
import { useRef, useState } from 'react';
import type React from 'react';

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

export default function Grid() {
  const rowSize = 4 as number;
  const grid = useGridStore((state) => state.grid);
  const selectedPoints = useGridStore((state) => state.selectedPoints);
  const selectPoint = useGridStore((state) => state.changeSelect);

  return (
    <div className={classNames('mt-4')}>
      <div className={classNames('flex justify-center')}>
        <Card
          className={classNames('w-full p-1', {
            'max-w-[62rem]': rowSize === 10,
            'max-w-[56rem]': rowSize === 9,
            'max-w-[50rem]': rowSize === 8,
            'max-w-[44rem]': rowSize === 7,
            'max-w-[38rem]': rowSize === 6,
            'max-w-[32rem]': rowSize === 5,
            'max-w-[26rem]': rowSize === 4,
          })}
        >
          {grid.map((row, i) => (
            <div key={i} className={classNames('flex items-start justify-start')}>
              {row.map((cell, j) => (
                <EffectPoint
                  point={cell}
                  onClick={() => selectPoint(i, j)}
                  onDoubleClick={() => selectPoint(i, j, false)}
                  key={j}
                  isFocus={selectedPoints.at(-1) === cell}
                  rowSize={rowSize}
                >
                  {cell.text}
                </EffectPoint>
              ))}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

interface PoetryPointProps {
  point: PoetryPoint;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLButtonElement>;
  isFocus?: boolean;
  children: React.ReactNode;
  rowSize?: number;
}
const EffectPoint = (pros: PoetryPointProps) => {
  const { onClick, children, isFocus, point, rowSize = 4 } = pros;
  const { isComplete, isSelected } = point;
  const [effect, setEffect] = useState(false);
  const pointRef = useRef<HTMLButtonElement>(null);

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    setEffect(true);
    onClick && onClick(e);
    setTimeout(() => {
      setEffect(false);
    }, 500);
  }
  function handleDoubleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    pros.onDoubleClick && pros.onDoubleClick(e);
  }
  setAnimateFrom(point.resId, pointRef);

  return (
    <div
      className={classNames('relative flex w-full', {
        'm-0.5 text-3xl sm:m-1 sm:text-4xl lg:text-5xl': rowSize > 8,
        'm-1 text-4xl sm:text-4xl lg:text-5xl': rowSize > 6,
        'm-1 text-5xl': rowSize <= 6,
      })}
    >
      <button
        disabled={isComplete}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={classNames(
          'relative w-full cursor-pointer rounded-xl bg-amber-100 pb-[100%] text-center ',
          'transition-colors',
          { 'bg-amber-200 ': !isComplete && isSelected },
          { 'animate-shake': !isComplete && !isFocus && effect },
          { 'animate-focus': !isComplete && isFocus },
          { 'bg-slate-200': isComplete },
        )}
      >
        <div
          className={classNames(
            'absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-300 text-sm text-white ',
            'delay-50 transition-all duration-150',
            { 'opacity-0 ': !isFocus },
          )}
        >
          {point.num}
        </div>
        <div className={classNames('absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2')}>
          <span ref={pointRef}> {children}</span>
        </div>
      </button>
    </div>
  );
};

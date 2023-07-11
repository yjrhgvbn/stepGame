import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useIdiomsStore } from './IdiomsStore';
import { clearAnimate, setAnimateFrom } from './animate';
import { type Point, extendGrid, generateGrid, loopStartPoint, pickIdiomStartPoints } from './generateGrid';
import { usePoetryStore } from './poetryStore';
import { randomChinese } from './utils';
import classNames from 'classnames';
import { clamp, remove } from 'lodash';
import { Eraser, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  isSeleted: boolean;
  next: PoetryPoint | null;
  prev: PoetryPoint | null;
  text: string;
} & Point;

export function Grid() {
  const [rowSize, setRowSize] = useState(4);
  const [grid, setGrid] = useState<PoetryPoint[][]>([]);
  const [selectedPoints, setSelectedPoints] = useState<PoetryPoint[]>([]);
  // const anserLine = usePoetryStore((state) => state.anserLine);

  const resetPoetry = usePoetryStore((state) => state.resetPoetry);
  const randomIdioms = useIdiomsStore((state) => state.randomIdioms);
  const clearPoetrySelect = usePoetryStore((state) => state.clearSelect);
  const clearIdiomSelect = useIdiomsStore((state) => state.clearSelect);
  const changePoetrySelect = usePoetryStore((state) => state.changeSelect);
  const changeIdiomSelect = useIdiomsStore((state) => state.changeSelect);

  const handleRsest = () => {
    clearPoetrySelect();
    clearIdiomSelect();
    setSelectedPoints([]);
    grid.forEach((row) => row.forEach((point) => (point.isSeleted = false)));
    setGrid([...grid]);
  };

  const handleGenerate = () => {
    clearAnimate();
    handleRsest();
    const anserLine = resetPoetry();
    const anserLen = anserLine.characters.length - 2;
    const gridLen = clamp(Math.ceil(anserLen) + 2, 4, 10);
    setRowSize(gridLen);
    const grid = generateGrid(gridLen, anserLen);
    const poetryGrid = extendGrid<PoetryPoint>(grid, () => ({
      resIndex: 0,
      resId: '',
      resType: null,
      isComplete: false,
      isSeleted: false,
      text: '',
    })).map((row) => {
      if (!row[0].prev && row[0].isInStepPath) {
        loopStartPoint(row[0], (_, i) => ({
          resIndex: i,
          resId: anserLine.characters[i].key,
          resType: ResType.Poetry,
          text: anserLine.characters[i].text,
        }));
      }
      return row;
    });
    const [startPoints, resStartPoints] = pickIdiomStartPoints(poetryGrid);
    const idioms = randomIdioms(startPoints.length);
    startPoints.forEach((point, i) =>
      loopStartPoint(point, (_, j) => ({ resIndex: j, text: idioms[i].words[j].text, resType: ResType.Idiom, resId: idioms[i].words[j].key })),
    );
    resStartPoints.forEach((point) =>
      loopStartPoint(point, (p, j) => {
        if (p.resType) return;
        return { resIndex: j, text: randomChinese(), resType: ResType.Random };
      }),
    );
    setGrid(poetryGrid);
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleClick = (i: number, j: number, isSeletd = true) => {
    const point = grid[i][j];
    let isComplete = false;
    // TODO 不完全符合不算完成
    if (point.resType === ResType.Poetry) {
      isComplete = changePoetrySelect(point.resId, isSeletd).isComplete;
    } else if (point.resType === ResType.Idiom) {
      isComplete = changeIdiomSelect(point.resId, isSeletd).isComplete;
    }
    point.isSeleted = isSeletd;
    if (isComplete) {
      loopStartPoint(point, (p) => {
        remove(selectedPoints, (item) => item.resId === p.resId);
        p.isComplete = true;
      });
    } else {
      remove(selectedPoints, (item) => item.resId === point.resId);
      if (isSeletd) selectedPoints.push(point);
    }
    setSelectedPoints([...selectedPoints]);
    setGrid([...grid]);
  };

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
                  onClick={() => handleClick(i, j)}
                  onDoubleClick={() => handleClick(i, j, false)}
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
      <div className={classNames('fixed bottom-3 left-1/2 -translate-x-1/2 ')}>
        <div>
          <Button variant="default" onClick={handleGenerate} className="h-12 text-lg">
            <RotateCw className="mr-2 h-6 w-6" />
            换一个
          </Button>
          <Button variant="default" onClick={handleRsest} className={classNames('ml-2 h-12 text-lg')} disabled={!selectedPoints.length}>
            <Eraser className="mr-2 h-6 w-6" />
            重置
          </Button>
        </div>
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
  const { isComplete, isSeleted } = point;
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
          { 'bg-amber-200 ': !isComplete && isSeleted },
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

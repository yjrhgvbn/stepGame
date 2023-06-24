import { Card, CardContent } from '../components/ui/card';
import { useIdiomsAnimateStore, useIdiomsStore } from './IdiomsStore';
import { clearAnimateStore, useAnimateStart } from './animate';
import { type Point, extendGrid, generateGrid, loopStartPoint, pickIdiomStartPoints } from './generateGrid';
import { usePoetryStore } from './poetryStore';
import { randomChinese } from './utils';
import { animated, useSpring } from '@react-spring/web';
import classNames from 'classnames';
import { clamp } from 'lodash';
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
} & Point;

export function Grid() {
  const [grid, setGrid] = useState<PoetryPoint[][]>([]);
  const [selectedPoints, setSelectedPoints] = useState<PoetryPoint[]>([]);
  const anserLine = usePoetryStore((state) => state.anserLine);

  const selectPoetry = usePoetryStore((state) => state.changeSelect);
  const randomIdioms = useIdiomsStore((state) => state.randomIdioms);
  const changeIdiomSelect = useIdiomsStore((state) => state.changeSelect);

  const handleGenerate = () => {
    clearAnimateStore();
    const anserLen = anserLine.characters.length - 2;
    const gridLen = clamp(Math.ceil(anserLen) + 2, 4, 10);
    const grid = generateGrid(gridLen, anserLen);
    const poetryGrid = extendGrid<PoetryPoint>(grid, () => ({ resIndex: 0, resId: '', resType: null, isComplete: false, isSeleted: false })).map(
      (row) => {
        if (!row[0].prev && row[0].isPath) {
          loopStartPoint(row[0], (_, i) => ({
            resIndex: i,
            resId: anserLine.characters[i].key,
            resType: ResType.Poetry,
            text: anserLine.characters[i].text,
          }));
        }
        return row;
      },
    );
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
      isComplete = selectPoetry(point.resId, isSeletd).isComplete;
    } else if (point.resType === ResType.Idiom) {
      isComplete = changeIdiomSelect(point.resId, isSeletd).isComplete;
    }
    point.isSeleted = isSeletd;
    if (isComplete) {
      loopStartPoint(point, (p) => {
        p.isComplete = true;
      });
      setSelectedPoints([]);
    } else {
      const index = selectedPoints.findIndex((item) => item === point);
      if (index !== -1) {
        selectedPoints.splice(index, 1);
      }
      if (isSeletd) selectedPoints.push(point);
      setSelectedPoints([...selectedPoints]);
    }
    setGrid([...grid]);
  };

  return (
    <div>
      <button onClick={handleGenerate}>刷新</button>
      <div className={classNames('flex justify-center')}>
        <Card className="inline-block p-2">
          {grid.map((row, i) => (
            <div key={i} className="flex">
              {row.map((cell, j) => (
                <EffectPoint
                  point={cell}
                  onClick={() => handleClick(i, j)}
                  onDoubleClick={() => handleClick(i, j, false)}
                  key={j}
                  isFocus={selectedPoints.at(-1) === cell}
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
}
const EffectPoint = (pros: PoetryPointProps) => {
  const { onClick, children, isFocus, point } = pros;
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
  useAnimateStart(point.resId, pointRef, [isComplete, point]);

  return (
    <button
      disabled={isComplete}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={classNames(
        'text relative m-1 box-border  flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl bg-amber-100 p-0 text-center text-5xl',
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
      <span ref={pointRef}> {children}</span>
    </button>
  );
};

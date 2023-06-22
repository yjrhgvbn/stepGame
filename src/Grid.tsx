import { useIdiomsStore } from './IdiomsStore';
import { type Point, extendGrid, generateGrid, loopStartPoint, pickIdiomStartPoints } from './generateGrid';
import { usePoetryStore } from './poetryStore';
import { randomChinese } from './utils';
import classNames from 'classnames';
import { clamp } from 'lodash';
import { useEffect, useState } from 'react';
import type React from 'react';

enum ResType {
  Idiom,
  Poetry,
  Random,
}

type PoetryPoint = {
  resId: string;
  resType: ResType | null;
  isComplete: boolean;
  isSeleted: boolean;
  next: PoetryPoint | null;
  prev: PoetryPoint | null;
} & Point;

export function Grid() {
  const [grid, setGrid] = useState<PoetryPoint[][]>([]);
  const [selectedPoints, setSelectedPoints] = useState<PoetryPoint[]>([]);
  const anserLine = usePoetryStore((state) => state.anserLine);

  const updatePoetry = usePoetryStore((state) => state.updatePoetry);
  const randomIdioms = useIdiomsStore((state) => state.randomIdioms);
  const changeIdiomSelect = useIdiomsStore((state) => state.changeSelect);

  const handleGenerate = () => {
    const anserLen = anserLine.characters.length - 2;
    const gridLen = clamp(Math.ceil(anserLen * 1.5), 4, 10);
    const grid = generateGrid(gridLen, anserLen);
    const poetryGrid = extendGrid<PoetryPoint>(grid, () => ({ resId: '', resType: null, isComplete: false, isSeleted: false })).map((row) => {
      if (!row[0].prev && row[0].isPath) {
        loopStartPoint(row[0], (_, i) => ({ resId: anserLine.characters[i].key, resType: ResType.Poetry, text: anserLine.characters[i].text }));
      }
      return row;
    });
    const [startPoints, resStartPoints] = pickIdiomStartPoints(poetryGrid);
    const idioms = randomIdioms(startPoints.length);
    startPoints.forEach((point, i) =>
      loopStartPoint(point, (_, j) => ({ text: idioms[i].words[j].text, resType: ResType.Idiom, resId: idioms[i].words[j].key })),
    );
    resStartPoints.forEach((point) =>
      loopStartPoint(point, (p) => {
        if (p.resType) return;
        return { text: randomChinese(), resType: ResType.Random };
      }),
    );
    setGrid(poetryGrid);
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleClick = (i: number, j: number, isSeletd = true) => {
    const point = grid[i][j];
    if (point.resType === ResType.Poetry) {
      updatePoetry(point.resId);
    }
    point.isSeleted = isSeletd;
    const res = changeIdiomSelect(point.resId, isSeletd);
    if (res.isComplete) {
      loopStartPoint(point, (p) => {
        p.isComplete = true;
      });
    }
    const index = selectedPoints.findIndex((item) => item === point);
    if (index !== -1) {
      selectedPoints.splice(index, 1);
    }
    if (isSeletd) selectedPoints.push(point);
    setSelectedPoints([...selectedPoints]);
    setGrid([...grid]);
  };

  return (
    <div>
      <button onClick={handleGenerate}>刷新</button>
      <div className="mx-auto my-8 mt-10 w-8/12 rounded border border-gray-200 p-4 shadow-md dark:border-neutral-600 dark:bg-neutral-800 dark:shadow-none">
        {grid.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => (
              <EffectPoint
                onClick={() => handleClick(i, j)}
                onDoubleClick={() => handleClick(i, j, false)}
                num={cell.num}
                isSeleted={cell.isSeleted}
                isComplete={cell.isComplete}
                key={j}
                isFocus={selectedPoints.at(-1) === cell}
              >
                {cell.text}
              </EffectPoint>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PoetryPointProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLButtonElement>;
  isSeleted?: boolean;
  isComplete?: boolean;
  isFocus?: boolean;
  children: React.ReactNode;
  num?: number;
}
const EffectPoint = (pros: PoetryPointProps) => {
  const { onClick, isSeleted, children, isFocus, num, isComplete } = pros;
  const [effect, setEffect] = useState(false);
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
  return (
    <button
      disabled={isComplete}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={classNames(
        'text relative m-1 flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl bg-amber-100 text-center text-5xl',
        'transition-all delay-100',
        { 'bg-amber-200 ': !isComplete && isSeleted },
        { 'animate-shake': !isComplete && !isFocus && effect },
        { 'animate-focus': !isComplete && isFocus },
        { 'bg-slate-200': isComplete },
        // { 'hover:animate-none': !effect },
      )}
    >
      <div
        className={classNames(
          'absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-300 text-sm text-white ',
          'transition-all delay-150 duration-150',
          { 'opacity-0 ': !isFocus },
        )}
        //  className="  ">
      >
        {num}
      </div>

      {children}
    </button>
  );
};

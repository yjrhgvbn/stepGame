import { useIdiomsStore } from './IdiomsStore';
import { type Point, extendGrid, generateGrid, loopStartPoint, pickIdiomStartPoints } from './generateGrid';
import { PoertyCharacter, usePoetryStore } from './poetryStore';
import { randomChinese } from './utils';
import { clamp } from 'lodash';
import { useEffect, useState } from 'react';

enum ResType {
  Idiom,
  Poetry,
  Random,
}

type PoetryPoint = {
  resId: string;
  resType: ResType | null;
  isSeleted: boolean;
  next: PoetryPoint | null;
  prev: PoetryPoint | null;
} & Point;

export function Grid() {
  const [grid, setGrid] = useState<PoetryPoint[][]>([]);
  const [selected, setSelected] = useState<PoetryPoint[]>([]);
  const anserLine = usePoetryStore((state) => state.anserLine);

  const updatePoetry = usePoetryStore((state) => state.updatePoetry);
  const randomIdioms = useIdiomsStore((state) => state.randomIdioms);
  const setCompete = useIdiomsStore((state) => state.setCompete);

  const handleGenerate = () => {
    const anserLen = anserLine.characters.length - 2;
    const gridLen = clamp(Math.ceil(anserLen * 1.5), 4, 10);
    const grid = generateGrid(gridLen, anserLen);
    const poetryGrid = extendGrid<PoetryPoint>(grid, () => ({ resId: '', isSeleted: false, resType: null })).map((row) => {
      if (!row[0].prev && row[0].isPath) {
        loopStartPoint(row[0], (_, i) => ({ resId: anserLine.characters[i].key, resType: ResType.Poetry, text: anserLine.characters[i].text }));
      }
      return row;
    });
    const [startPoints, resStartPoints] = pickIdiomStartPoints(poetryGrid);
    const idioms = randomIdioms(startPoints.length);
    startPoints.forEach((point, i) => loopStartPoint(point, (_, j) => ({ text: idioms[i].word[j], resType: ResType.Idiom, resId: idioms[i].id })));
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

  const handleClick = (i: number, j: number) => {
    const point = grid[i][j];
    if (point.resType === ResType.Poetry) {
      updatePoetry(point.resId);
    }
    point.isSeleted = !point.isSeleted;
    if (point.isSeleted) {
      selected.push(point);
      const index = selected.findIndex((item) => !item.prev);
      let isAllInSelected = true;
      if (index !== -1) {
        const selectedFlag = new Array<boolean>(selected.length).fill(false);
        loopStartPoint(selected[index], (point) => {
          const curIndex = selected.findIndex((item) => item === point);
          if (curIndex !== -1) selectedFlag[curIndex] = true;
          else isAllInSelected = false;
        });
        isAllInSelected = isAllInSelected && selectedFlag.every((item) => item);
        if (isAllInSelected) {
          setCompete(selected[index].resId);
          setSelected([]);
          // loopStartPoint(selected[index], (point) => {
          //   point.isPath = true;
          // });
        }
      }
      setSelected([...selected]);
    } else {
      const index = selected.findIndex((item) => item === point);
      selected.splice(index, 1);
      setSelected([...selected]);
    }
    setGrid([...grid]);
  };

  return (
    <div>
      <button onClick={handleGenerate}>刷新</button>
      <div className="mx-auto my-8 mt-10 w-8/12 rounded border border-gray-200 p-4 shadow-md dark:border-neutral-600 dark:bg-neutral-800 dark:shadow-none">
        {grid.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => (
              <div
                onClick={() => handleClick(i, j)}
                key={j}
                className={`h-8 w-8 border border-gray-200 dark:border-neutral-600 ${cell.isPath ? 'bg-gray-200 dark:bg-neutral-700' : ''}`}
              >
                {cell.text || cell.num}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

import Poetry from './Poetry';
import { type Point, generateGrid, pickIdiomStartPoints } from './generateGrid';
import { PoertyCharacter, usePoetryStore } from './poetryStore';
import { randomChinese, randomIdioms } from './utils';
import { clamp } from 'lodash';
import { useEffect, useState } from 'react';

type PoetryPoint = {
  character?: PoertyCharacter;
} & Point;

export default function App() {
  const [grid, setGrid] = useState<PoetryPoint[][]>([]);
  const anserLine = usePoetryStore((state) => state.anserLine);
  const updatePoetry = usePoetryStore((state) => state.updatePoetry);

  const handleGenerate = () => {
    // resetPoetry();
    const anserLen = anserLine.characters.length - 2;
    const gridLen = clamp(Math.ceil(anserLen * 1.5), 4, 10);
    const grid = generateGrid(gridLen, anserLen);
    const [startPoints, resStartPoints] = pickIdiomStartPoints(grid);
    const poetryGrid: PoetryPoint[][] = grid.map((row) => {
      if (!row[0].prev && row[0].isPath) {
        let cur: PoetryPoint | null = row[0];
        anserLine.characters.forEach((c) => {
          if (!cur) return;
          cur.character = c;
          cur.text = c.text;
          cur = cur.next;
        });
      }
      return row as PoetryPoint[];
    });
    const idioms = randomIdioms(startPoints.length);
    startPoints.forEach((point, i) => {
      let cur: PoetryPoint | null = point;
      idioms[i].word.split('').forEach((c) => {
        if (!cur) return;
        cur.text = c;
        cur = cur.next;
      });
    });
    resStartPoints.forEach((point) => {
      if (point.isPath) return;
      let cur: PoetryPoint | null = point;
      while (cur) {
        cur.text = randomChinese();
        cur = cur.next;
      }
    });
    setGrid(poetryGrid);
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleSetLine = (i: number, j: number) => {
    const point = grid[i][j];
    if (point.character) {
      // point.character.isShow = true;
      updatePoetry(point.character);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate}>刷新</button>
      <div className="mx-auto my-8 mt-10 w-8/12 rounded border border-gray-200 p-4 shadow-md dark:border-neutral-600 dark:bg-neutral-800 dark:shadow-none">
        {grid.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => (
              <div
                onClick={() => handleSetLine(i, j)}
                key={j}
                className={`h-8 w-8 border border-gray-200 dark:border-neutral-600 ${cell.isPath ? 'bg-gray-200 dark:bg-neutral-700' : ''}`}
              >
                {cell.text || cell.num}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Poetry />
    </div>
  );
}

import { Card } from '../components/ui/card';
import { startAnimate } from './animate';
import { PoetryCharacter, PoetryLine, usePoetryStore } from './store/poetryStore';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';

export default function Poetry() {
  const author = usePoetryStore((state) => state.author);
  const title = usePoetryStore((state) => state.title);
  const lines = usePoetryStore((state) => state.lines);
  // 根据行数生成数组
  const fullLines = lines.reduce((acc: PoetryLine[][], line) => {
    const currentLine = acc.at(-1);
    if (currentLine?.at(-1)?.lineNum === line.lineNum) {
      currentLine.push(line);
    } else {
      acc.push([line]);
    }
    return acc;
  }, []);
  return (
    <div className={classNames('')}>
      <Card className="max-h-[60vh] max-w-full overflow-scroll p-4">
        <div className={classNames('text-2xl')}>{title}</div>
        <div className={classNames('text-sm text-gray-500')}>{author}</div>
        {fullLines.map((shortLines, i) => (
          <div key={i} className="text-xl">
            {shortLines.map((line, j) => (
              <div key={j} className={classNames('z-20 inline whitespace-nowrap')}>
                {line.characters.map((character) => {
                  return !line.isAnswer ? (
                    <div key={character.key} className={`inline w-6 `}>
                      {character.text}
                    </div>
                  ) : (
                    <PoetryChar key={character.key} word={character} isComplete={line.isComplete}>
                      {character.text}
                    </PoetryChar>
                  );
                })}
                {line.punctuation}
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}
const PoetryChar = (props: { children: React.ReactNode; word: PoetryCharacter; isComplete: boolean }) => {
  const { word, isComplete } = props;
  const idiomRef = useRef(null);
  useEffect(() => {
    if (isComplete) {
      startAnimate(word.key, idiomRef);
    }
  }, [isComplete]);

  return (
    <div className={classNames('inline-block h-5 w-5 text-amber-500')}>
      <div ref={idiomRef} id={word.key} className="absolute z-50 ">
        {isComplete ? props.children : '_'}
      </div>
    </div>
  );
};

import { Card } from '../components/ui/card';
import { useAnimateEnd } from './animate';
import { PoertyCharacter, PoertyLine, usePoetryStore } from './poetryStore';
import { animated } from '@react-spring/web';
import classNames from 'classnames';
import { useRef } from 'react';

export default function App() {
  const author = usePoetryStore((state) => state.author);
  const title = usePoetryStore((state) => state.title);
  const lines = usePoetryStore((state) => state.lines);
  // 根据行数生成数组
  const fullLines = lines.reduce((acc: PoertyLine[][], line) => {
    const currentLine = acc.at(-1);
    if (currentLine?.at(-1)?.lineNum === line.lineNum) {
      currentLine.push(line);
    } else {
      acc.push([line]);
    }
    return acc;
  }, []);
  return (
    <div className={classNames('flex justify-center')}>
      <Card className="inline-block p-4">
        <div className={classNames('text-2xl')}>{title}</div>
        <div className={classNames('text-sm text-gray-500')}>{author}</div>
        {fullLines.map((shortLines, i) => (
          <div key={i} className="flex flex-wrap">
            {shortLines.map((line, j) => (
              <div key={j} className={classNames('z-20 flex')}>
                {line.characters.map((character) => {
                  return !character.isAnser ? (
                    <div key={character.key} className={`w-6 text-xl`}>
                      {character.text}
                    </div>
                  ) : (
                    <PoetryChar key={character.key} word={character} isComplete={character.isComplete}>
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
const PoetryChar = (props: { children: React.ReactNode; word: PoertyCharacter; isComplete: boolean }) => {
  const { word, isComplete } = props;
  const idiomRef = useRef(null);
  const springs = useAnimateEnd(word.key, idiomRef, isComplete, { width: '1.5rem', height: '1.75rem' });

  return (
    <div ref={idiomRef} className={classNames('h-6 w-6 text-xl')}>
      <animated.div id={word.key} className="flex h-6 w-6 items-center justify-center" style={springs}>
        {isComplete ? props.children : '_'}
      </animated.div>
    </div>
  );
};

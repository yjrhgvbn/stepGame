import { PoertyLine, usePoetryStore } from './poetryStore';

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
    <div className="mx-auto my-8 mt-10 w-8/12 rounded border border-gray-200 p-4 shadow-md dark:border-neutral-600 dark:bg-neutral-800 dark:shadow-none">
      <div>{author}</div>
      <div>{title}</div>
      {fullLines.map((shortLines, i) => (
        <div key={i} className="flex flex-wrap">
          {shortLines.map((line, j) => (
            <div key={j}>
              {line.characters.map((character, k) => (
                <span key={k} className={`h-8 w-8 border border-gray-200 dark:border-neutral-600 ${!character.isShow ? 'opacity-0' : ''}`}>
                  {character.text}
                </span>
              ))}
              {line.punctuation}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { IdiomWord, useIdiomsStore } from './IdiomsStore';
import { startAnimate } from './animate';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';

export default function Idioms() {
  const idioms = useIdiomsStore((state) => state.idioms);
  return (
    <div className={classNames('mt-4 grid  grid-cols-[repeat(auto-fill,14rem)] justify-center')}>
      {idioms.map((idiom) => (
        <div key={idiom.key} className={classNames('m-2 flex justify-center')}>
          <Card className={classNames('w-30 ')}>
            <CardHeader>
              <CardTitle className={classNames('flex')}>
                {idiom.words.map((word) => (
                  <IdomChar key={word.key} word={word} isComplete={idiom.isComplete}>
                    {word.text}
                  </IdomChar>
                ))}
              </CardTitle>
            </CardHeader>
            <CardContent className={classNames('max-h-36 overflow-y-scroll p-4  pt-0 ')}>{idiom.explanation}</CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

const IdomChar = (props: { children: React.ReactNode; word: IdiomWord; isComplete: boolean }) => {
  const { word, isComplete } = props;
  const idiomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isComplete) {
      startAnimate(word.key, idiomRef);
    }
  }, [isComplete]);

  return (
    <div className={classNames('h-10 w-10 text-4xl')}>
      <div id={word.key} className=" z-50 flex h-10 w-10 items-center justify-center text-4xl">
        <span ref={idiomRef}> {isComplete ? props.children : '_'}</span>
      </div>
    </div>
  );
};

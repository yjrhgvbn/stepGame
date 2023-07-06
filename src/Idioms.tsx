import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { IdiomWord, useIdiomsStore } from './IdiomsStore';
import { useAnimateEnd } from './animate';
import { animated } from '@react-spring/web';
import classNames from 'classnames';
import { useRef } from 'react';

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
  const idiomRef = useRef(null);
  const springs = useAnimateEnd(word.key, idiomRef, isComplete, { width: '2.5rem', height: '2.5rem' });

  return (
    <div ref={idiomRef} className={classNames('h-10 w-10 text-4xl')}>
      <animated.div id={word.key} className=" z-50 flex h-10 w-10 items-center justify-center text-4xl" style={springs}>
        {isComplete ? props.children : '_'}
      </animated.div>
    </div>
  );
};

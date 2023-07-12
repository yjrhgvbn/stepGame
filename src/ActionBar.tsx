import { Button } from '../components/ui/button';
import { useGridStore } from './store/gridStore';
import classNames from 'classnames';
import { Eraser, RotateCw } from 'lucide-react';
import type React from 'react';

export const ActionBar = () => {
  const resetPoetry = useGridStore((store) => store.restart);
  const clearSelect = useGridStore((store) => store.clearSelect);

  const handleGenerate = () => {
    resetPoetry();
  };

  const handleRsest = () => {
    clearSelect();
  };

  return (
    <div className={classNames('fixed bottom-3 left-1/2 -translate-x-1/2 ')}>
      <div>
        <Button variant="default" onClick={handleGenerate} className="h-12 text-lg">
          <RotateCw className="mr-2 h-6 w-6" />
          换一个
        </Button>
        <Button variant="default" onClick={handleRsest} className={classNames('ml-2 h-12 text-lg')}>
          <Eraser className="mr-2 h-6 w-6" />
          重置
        </Button>
      </div>
    </div>
  );
};
export default ActionBar;

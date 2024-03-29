import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { Button, buttonVariants } from '../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../components/utils';
import { useConfigStore } from './store/configStore';
import { useGridStore } from './store/gridStore';
import { Label } from '/components/ui/label';
import { Switch } from '/components/ui/switch';
import classNames from 'classnames';
import { Eraser, RotateCw, Settings } from 'lucide-react';
import type React from 'react';

export const ActionBar = () => {
  const resetPoetry = useGridStore((store) => store.restart);
  const clearSelect = useGridStore((store) => store.clearSelect);
  const commitSelect = useGridStore((store) => store.commitSelect);
  const setGridLen = useConfigStore((store) => store.setGridLen);
  const gridLen = useConfigStore((store) => store.gridLen);
  const setFullMatch = useConfigStore((store) => store.setFullMatch);
  const fullMatch = useConfigStore((store) => store.fullMatch);

  const ableGridLen = useConfigStore((store) => store.ableGridLen);

  const handleGenerate = () => {
    resetPoetry();
  };

  const handleReset = () => {
    clearSelect();
  };

  const handleFullMatch = (newFullMatch: boolean) => {
    setFullMatch(newFullMatch);
    commitSelect();
  };

  const handleGridLenChange = (e: string) => {
    setGridLen(parseInt(e));
    resetPoetry();
  };

  return (
    <div className={classNames('fixed bottom-3 left-1/2 -translate-x-1/2 ')}>
      <div>
        <Button variant="default" onClick={handleGenerate} className="h-12 text-lg">
          <RotateCw className="h-6 w-6" />
          <span className={classNames('ml-2 hidden md:block')}> 换一个</span>
        </Button>
        <Button variant="default" onClick={handleReset} className={classNames('ml-2 h-12 text-lg')}>
          <Eraser className="h-6 w-6" />
          <span className={classNames('ml-2 hidden md:block')}> 重置</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger>
            <div className={cn(buttonVariants({ variant: 'default', size: 'default', className: 'ml-2 h-12 text-lg' }))}>
              <Settings className="h-6 w-6" />
              <span className={classNames('ml-2 hidden md:block')}> 设置</span>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={classNames('text-5xl')}>设置</AlertDialogTitle>
              <div className="grid w-full items-center gap-4 pt-4 text-left">
                <div className="flex flex-col space-y-1.5">
                  <Label className={classNames('text-2xl')}>表格长度</Label>
                  <Select defaultValue={gridLen.toString()} onValueChange={handleGridLenChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择表格长度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ableGridLen.map((len) => (
                          <SelectItem key={len} value={len.toString()} className={classNames('h-10')}>
                            {len}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label className={classNames('text-2xl')}>是否要求完全匹配</Label>
                  {/* TODO 在小宽度下存在问题 */}
                  <Switch checked={fullMatch} onCheckedChange={handleFullMatch} />
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className={classNames('pt-5')}>
              <AlertDialogAction className={classNames(' h-12 text-2xl')}>保存</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
export default ActionBar;

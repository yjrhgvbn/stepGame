import { getGenerateKey } from './utils';
import { useSpring } from '@react-spring/web';
import { produce } from 'immer';
import { useEffect, useRef, useState } from 'react';
import { useUpdateEffect } from 'react-use';
import { StoreApi, UseBoundStore, create } from 'zustand';

interface AnimateStore {
  postion: { x: number; y: number };
  setPostion: (x: number, y: number) => void;
  clear: () => void;
}

const animateMap = new Map<string, UseBoundStore<StoreApi<AnimateStore>>>();

export const useAnimateStore = (id: string) => {
  if (!animateMap.has(id)) {
    animateMap.set(
      id,
      create<AnimateStore>((set) => ({
        postion: { x: 0, y: 0 },
        setPostion: (x: number, y: number) => set({ postion: { x, y } }),
        clear: () => set({ postion: { x: 0, y: 0 } }),
      })),
    );
  }
  return animateMap.get(id)!;
};

export const clearAnimateStore = (id?: string) => {
  if (id && animateMap.has(id)) {
    animateMap.get(id)!.getState().clear();
    animateMap.delete(id);
  } else {
    animateMap.forEach((store) => {
      store.getState().clear();
    });
    animateMap.clear();
  }
};

export const useAnimateStart = (key: string, ref: React.RefObject<any>, deps?: React.DependencyList) => {
  const setPostion = useAnimateStore(key)((state) => state.setPostion);
  useEffect(() => {
    if (!ref.current) return;
    const { x, y } = ref.current.getBoundingClientRect();
    setPostion(x + document.documentElement.scrollLeft, y + document.documentElement.scrollTop);
  }, deps);
};

export interface EndStyle {
  x?: number;
  y?: number;
  fontSize?: string;
  width?: string;
  height?: string;
}

export const useAnimateEnd = (key: string, ref: React.RefObject<any>, canSatart: boolean, endStyle: EndStyle) => {
  const animatePostion = useAnimateStore(key)((state) => state.postion);

  // TODO:处理元素缩放的情况
  const [springs, api] = useSpring(() => ({
    from: { x: 0, y: 0, ...endStyle },
  }));
  useEffect(() => {
    if (!ref.current || !canSatart) return;
    const { x, y } = ref.current.getBoundingClientRect();
    const xDistance = animatePostion.x - (x + document.documentElement.scrollLeft);
    const yDistance = animatePostion.y - (y + document.documentElement.scrollTop);
    api.start({
      from: {
        x: xDistance,
        y: yDistance,
        fontSize: '3rem',
        width: '3rem',
        height: '3rem',
      },
      to: { x: 0, y: 0, ...endStyle },
    });
  }, [animatePostion]);
  return springs;
};

// export const useAnimateStore = create<AnimateStore>((set) => ({
//   postion: { x: 0, y: 0 },
//   setPostion: (x: number, y: number) => set({ postion: { x, y } }),
// }));

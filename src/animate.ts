import { useSpring } from '@react-spring/web';
import { useEffect } from 'react';
import { StoreApi, UseBoundStore, create } from 'zustand';

interface StyleInfo {
  x: number;
  y: number;
  fontSize: string;
}

interface AnimateStore {
  style: StyleInfo;
  setStyle: (params: StyleInfo) => void;
  clear: () => void;
}

const animateMap = new Map<string, UseBoundStore<StoreApi<AnimateStore>>>();

export const useAnimateStore = (id: string) => {
  if (!animateMap.has(id)) {
    animateMap.set(
      id,
      create<AnimateStore>((set) => ({
        style: { x: 0, y: 0, fontSize: '3rem' },
        setStyle: (state) => set({ style: state }),
        clear: () => set({ style: { x: 0, y: 0, fontSize: '3rem' } }),
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
  const setStyle = useAnimateStore(key)((state) => state.setStyle);
  useEffect(() => {
    if (!ref.current) return;
    const font = window.getComputedStyle(ref.current).fontSize;
    const { x, y } = ref.current.getBoundingClientRect();
    setStyle({ x: x + document.documentElement.scrollLeft, y: y + document.documentElement.scrollTop, fontSize: font });
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
  const animateStyle = useAnimateStore(key)((state) => state.style);

  const [springs, api] = useSpring(() => ({
    from: { x: 0, y: 0, ...endStyle },
  }));
  useEffect(() => {
    if (!ref.current || !canSatart) return;
    const font = window.getComputedStyle(ref.current).fontSize;
    const { x, y } = ref.current.getBoundingClientRect();
    const xDistance = animateStyle.x - (x + document.documentElement.scrollLeft);
    const yDistance = animateStyle.y - (y + document.documentElement.scrollTop);
    api.start({
      from: {
        x: xDistance,
        y: yDistance,
        fontSize: animateStyle.fontSize,
      },
      to: { x: 0, y: 0, fontSize: font, ...endStyle },
    });
  }, [animateStyle]);
  return springs;
};

// export const useAnimateStore = create<AnimateStore>((set) => ({
//   postion: { x: 0, y: 0 },
//   setPostion: (x: number, y: number) => set({ postion: { x, y } }),
// }));

import { animated, useSpring } from '@react-spring/web';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';

function convertToStyle(ref: React.RefObject<any>): Record<string, number | string> {
  if (!ref || !ref.current) return {};
  const { x, y } = ref.current.getBoundingClientRect();
  const { fontSize, color, lineHeight } = window.getComputedStyle(ref.current);
  return { x, y, fontSize, color, lineHeight };
}

// 管理动画
class ConvertAnimateClass {
  private wrapperDom: HTMLDivElement;
  private fromMap = new Map<string, React.RefObject<any>>();
  private toMap = new Map<string, React.ReactPortal | null>();
  constructor() {
    const preDome = document.querySelector('#convert-animate-wrapper');
    if (preDome) {
      this.wrapperDom = preDome as HTMLDivElement;
    } else {
      const wrapperElement = document.createElement('div');
      wrapperElement.setAttribute('id', 'convert-animate-wrapper');
      document.body.appendChild(wrapperElement);
      this.wrapperDom = wrapperElement;
    }
  }
  public addFrom = (key: string, ref: React.RefObject<any>) => {
    this.fromMap.set(key, ref);
  };
  public startAnimate = (key: string, target: React.RefObject<any>) => {
    if (!this.fromMap.has(key) || this.toMap.has(key)) return this.toMap.get(key);
    const targetStyle = convertToStyle(target);
    const fromStyle = convertToStyle(this.fromMap.get(key)!);
    const portal = createPortal(
      <AnimatePortal fromStyle={fromStyle} endStyle={targetStyle} id={key}>
        {target.current.innerText}
      </AnimatePortal>,
      this.wrapperDom,
      key,
    );
    this.toMap.set(key, portal);
    useAnimateStore.getState().increaseConvertCount();
    return portal;
  };

  public endAnimate = (key: string) => {
    useAnimateStore.getState().decreaseConvertCount();
    this.toMap.set(key, null);
    if (useAnimateStore.getState().convertCount === 0) {
      this.toMap.clear();
    }
  };
  public reset = () => {
    this.toMap.clear();
    this.fromMap.clear();
    useAnimateStore.getState().reset();
  };

  public getPortal = (): React.ReactPortal[] => {
    return [...this.toMap.values()].filter(Boolean) as React.ReactPortal[];
  };
}

const convertAnimateInstance = new ConvertAnimateClass();

interface AnimateStore {
  convertCount: number;
  increaseConvertCount: () => void;
  decreaseConvertCount: () => void;
  reset: () => void;
}

// 触发更新
export const useAnimateStore = create<AnimateStore>((set) => ({
  convertCount: 0,
  increaseConvertCount: () => set((state) => ({ convertCount: state.convertCount + 1 })),
  decreaseConvertCount: () => set((state) => ({ convertCount: state.convertCount - 1 })),
  reset: () => set({ convertCount: 0 }),
}));

export function setAnimateFrom(key: string, ref: React.RefObject<any>) {
  convertAnimateInstance.addFrom(key, ref);
}

export function startAnimate(key: string, target: React.RefObject<any>) {
  return convertAnimateInstance.startAnimate(key, target);
}

export function clearAnimate() {
  convertAnimateInstance.reset();
}
const AnimatePortal = (props: {
  children: React.ReactNode;
  fromStyle: Record<string, number | string>;
  endStyle: Record<string, number | string>;
  id: string;
}) => {
  const { children, fromStyle, endStyle } = props;
  const [springs, api] = useSpring(() => ({
    from: endStyle,
  }));
  useEffect(() => {
    api.start({
      from: fromStyle,
      to: endStyle,
      onRest: () => {
        convertAnimateInstance.endAnimate(props.id);
      },
    });
  }, []);
  return (
    <animated.span className="fixed left-0 top-0 z-[999] text-4xl" style={springs}>
      {children}
    </animated.span>
  );
};

export const ConvertAnimate = () => {
  const convertCount = useAnimateStore((state) => state.convertCount);

  return (
    <>
      {convertCount
        ? convertAnimateInstance.getPortal().map((item) => {
            return item;
          })
        : null}
    </>
  );
};
export default ConvertAnimate;

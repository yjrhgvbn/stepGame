import { getGenerateKey } from '../utils';
import { randomPoetryBySize } from './configStore';
import { immerable, produce } from 'immer';
import { sample, xorBy } from 'lodash';
import { create } from 'zustand';

export interface Poetry {
  id: number;
  author: string;
  title: string;
  lines: PoetryLine[];
  answerLine: PoetryLine;
}

export class PoetryCharacter {
  [immerable] = true;
  text: string;
  key: string;
  constructor(key: string, text: string) {
    this.text = text;
    this.key = key;
  }
}

export class PoetryLine {
  [immerable] = true;
  isComplete: boolean; // 是否完全选中
  characters: PoetryCharacter[]; // 诗句
  punctuation: string; // 符号
  lineNum: number; // 行数
  isAnswer: boolean; // 是否是答案
  key: string; // 唯一标识
  constructor(key: string, lineNum: number) {
    this.lineNum = lineNum;
    this.characters = [];
    this.punctuation = '';
    this.key = key;
    this.isComplete = false;
    this.isAnswer = false;
  }
}

const CHINESE_ERG =
  /[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]/;

/**
 * 随机一首诗
 */
export function randomPoetry(): Poetry {
  const { getKey } = getGenerateKey('$poetry_');
  const initPoetry = randomPoetryBySize();
  if (!initPoetry) throw new Error('没有诗词了');

  const { author, paragraphs, title } = initPoetry;
  const lines: PoetryLine[] = [];
  paragraphs.forEach((paragraph, index) => {
    const line = index + 1;
    let newLine: PoetryLine = new PoetryLine(getKey(), line);
    const characters = paragraph.split('');
    for (const character of characters) {
      if (!CHINESE_ERG.test(character)) {
        newLine.punctuation = character;
        lines.push(newLine);
        newLine = new PoetryLine(getKey(), line);
      } else {
        newLine.characters.push(new PoetryCharacter(getKey(), character));
      }
    }
  });
  const answerLine = pickAnswerLine(lines, initPoetry.answerLen);
  return { author, title, lines, answerLine: answerLine, id: initPoetry.id };
}

/**
 * 随机选择一行作为答案
 */
function pickAnswerLine(lines: PoetryLine[], answerLen: number): PoetryLine {
  const filterCountLines = lines.filter((line) => line.characters.length === answerLen);
  const answerLine = sample(filterCountLines) || lines[0];
  if (answerLine) {
    answerLine.isAnswer = true;
  }
  return answerLine;
}

const initSate = randomPoetry();

export type PoetryStore = {
  selectedCharacterKey: string[];
  resetPoetry: () => PoetryLine;
  changeSelect: (key: string, isSelected?: boolean) => void;
  clearSelect: () => void;
  commitSelect: () => string[]; // 提交选中，根据选中设置是否完成
} & Poetry;
export const usePoetryStore = create<PoetryStore>((set, get) => ({
  ...initSate,
  selectedCharacterKey: [],
  resetPoetry: () => {
    const poetry = randomPoetry();
    set(poetry);
    return poetry.answerLine;
  },
  changeSelect: (key, isSelected = true) => {
    const { answerLine } = get();
    const isInAnswerLine = answerLine.characters.some((c) => c.key === key);
    if (!isInAnswerLine) throw new Error('不在答案行中');
    set(
      produce((state: PoetryStore) => {
        const inSelectedIndex = state.selectedCharacterKey.findIndex((k) => k === key);
        if (isSelected) {
          if (inSelectedIndex === -1) state.selectedCharacterKey.push(key);
        } else {
          if (inSelectedIndex !== -1) state.selectedCharacterKey.splice(inSelectedIndex, 1);
        }
      }),
    );
  },
  clearSelect() {
    set({ selectedCharacterKey: [] });
  },
  commitSelect: () => {
    const { answerLine, selectedCharacterKey } = get();
    if (selectedCharacterKey.length !== answerLine.characters.length) return [];
    const diffAnswer = xorBy(
      answerLine.characters.map((char) => char.key),
      selectedCharacterKey,
    );
    if (diffAnswer.length > 0) return [];
    set(
      produce((state: PoetryStore) => {
        state.answerLine.isComplete = true;
        state.lines.forEach((line) => {
          if (line.key === answerLine.key) {
            line.isComplete = true;
          }
        });
      }),
    );
    return answerLine.characters.map((char) => char.key);
  },
}));

export default usePoetryStore;

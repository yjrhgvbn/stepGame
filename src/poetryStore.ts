import tangPoertyList from '../assets/poetry/tang.json';
import { getGenerateKey } from './utils';
import { immerable, produce } from 'immer';
import { countBy, maxBy, sample } from 'lodash';
import { create } from 'zustand';

export interface Poerty {
  author: string;
  title: string;
  lines: PoertyLine[];
  anserLine: PoertyLine;
}

export class PoertyCharacter {
  [immerable] = true;
  text: string;
  isShow: boolean;
  key: string;
  constructor(key: string, text: string) {
    this.text = text;
    this.isShow = true;
    this.key = key;
  }
}

export class PoertyLine {
  [immerable] = true;
  characters: PoertyCharacter[]; // 诗句
  punctuation: string; // 符号
  lineNum: number; // 行数
  key: string; // 唯一标识
  constructor(key: string, lineNum: number) {
    this.lineNum = lineNum;
    this.characters = [];
    this.punctuation = '';
    this.key = key;
  }
}

const CHINESE_ERG =
  /[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]/;

/**
 * 随机一首诗
 */
export function randomPoetry(): Poerty {
  const { getKey } = getGenerateKey('$poetry_');
  const initPoerty = sample(tangPoertyList) || tangPoertyList[0];
  // const initPoerty = {
  //   author: '杜甫',
  //   title: '月夜忆舍弟',
  //   paragraphs: ['戍鼓断人行，边秋一雁声。', '露从今夜白，月是故乡明。', '有弟皆分散，无家问死生。', '寄书长不达，况乃未休兵。'],
  // };
  const { author, paragraphs, title } = initPoerty;
  const lines: PoertyLine[] = [];
  paragraphs.forEach((paragraph, index) => {
    const line = index + 1;
    let newLine: PoertyLine = new PoertyLine(getKey(), line);
    const characters = paragraph.split('');
    for (const character of characters) {
      if (!CHINESE_ERG.test(character)) {
        newLine.punctuation = character;
        lines.push(newLine);
        newLine = new PoertyLine(getKey(), line);
      } else {
        newLine.characters.push(new PoertyCharacter(getKey(), character));
      }
    }
  });
  const anserLine = pickAnserLine(lines);
  return { author, title, lines, anserLine };
}

/**
 * 随机选择一行作为答案
 */
function pickAnserLine(lines: PoertyLine[]): PoertyLine {
  const lineCount = countBy(lines, (line) => line.lineNum);
  // 一行诗词句大于4的去掉，排除一些特殊句
  let filterCountLines = lines.filter((line) => lineCount[line.lineNum] <= 4);
  if (!filterCountLines.length) filterCountLines = lines;
  // TODO: 也许需要优化
  // 随机取一个长度出现最多的句子
  const mostLineSize = maxBy(Object.entries(countBy(filterCountLines, (line) => line.characters.length)), (item) => item[1])![0];
  const filterLines = filterCountLines.filter((line) => line.characters.length === Number(mostLineSize));
  const anserLine = sample(filterLines) || filterLines[0] || lines[0];
  if (anserLine) {
    anserLine.characters.forEach((character) => {
      character.isShow = false;
    });
  }
  return anserLine;
}

const initSate = randomPoetry();

type PoertyStore = {
  resetPoetry: () => void;
  updatePoetry: (key: string) => void;
} & Poerty;
export const usePoetryStore = create<PoertyStore>((set, get) => ({
  ...initSate,
  resetPoetry: () => set(randomPoetry()),
  updatePoetry: (key) => {
    set(
      produce((state: PoertyStore) => {
        const line = state.lines.find((line) => line.key === state.anserLine.key);
        if (line) {
          const tCharacter = line.characters.find((c) => c.key === key);
          if (tCharacter) {
            tCharacter.isShow = true;
          }
        }
        return state;
        // state.author = '123';
      }),
    );
  },
}));
// usePoetryStore((state) => state.poetry);
export default usePoetryStore;

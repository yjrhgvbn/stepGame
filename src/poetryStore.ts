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
  isAnser: boolean;
  isComplete: boolean;
  isSeleted: boolean;
  key: string;
  constructor(key: string, text: string) {
    this.text = text;
    this.isAnser = false;
    this.isComplete = false;
    this.key = key;
    this.isSeleted = false;
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
  //   title: '观公孙大娘弟子舞剑器行',
  //   paragraphs: [
  //     '大历二年十月十九日，夔府别驾元持宅，见临颍李十二娘舞剑器，壮其蔚跂，问其所师，曰：“余公孙大娘弟子也。”开元五载，余尚童稚，记于郾城观公孙氏，舞剑器浑脱，浏漓顿挫，独出冠时，自高头宜春梨园二伎坊内人洎外供奉，晓是舞者，圣文神武皇帝初，公孙一人而已。玉貌锦衣，况余白首，今兹弟子，亦非盛颜。既辨其由来，知波澜莫二，抚事慷慨，聊为剑器行。昔者吴人张旭，善草书帖，数常于邺县见公孙大娘舞西河剑器，自此草书长进，豪荡感激，即公孙可知矣。',
  //     '昔有佳人公孙氏，一舞剑器动四方。',
  //     '观者如山色沮丧，天地为之久低昂。',
  //     '耀如羿射九日落，矫如群帝骖龙翔。',
  //     '来如雷霆收震怒，罢如江海凝清光。',
  //     '绛唇珠袖两寂寞，晚有弟子传芬芳。',
  //     '临颍美人在白帝，妙舞此曲神扬扬。',
  //     '与余问答既有以，感时抚事增惋伤。',
  //     '先帝侍女八千人，公孙剑器初第一。',
  //     '五十年间似反掌，风尘澒动昏王室。',
  //     '梨园弟子散如烟，女乐余姿映寒日。',
  //     '金粟堆前木已拱，瞿唐石城草萧瑟。',
  //     '玳筵急管曲复终，乐极哀来月东出。',
  //     '老夫不知其所往，足茧荒山转愁疾。',
  //   ],
  // };
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
      character.isAnser = true;
    });
  }
  return anserLine;
}

const initSate = randomPoetry();

type PoertyStore = {
  resetPoetry: () => PoertyLine;
  changeSelect: (key: string, isSelected?: boolean) => { isComplete: boolean };
  clearSelect: () => void;
} & Poerty;
export const usePoetryStore = create<PoertyStore>((set, get) => ({
  ...initSate,
  resetPoetry: () => {
    const poetry = randomPoetry();
    set(poetry);
    return poetry.anserLine;
  },
  changeSelect: (key, isSelected = true) => {
    let res = { isComplete: false };
    set(
      produce((state: PoertyStore) => {
        const line = state.lines.find((line) => line.key === state.anserLine.key);
        if (line) {
          const tCharacter = line.characters.find((c) => c.key === key);
          if (tCharacter) {
            tCharacter.isSeleted = isSelected;
            if (line.characters.every((c) => c.isSeleted)) {
              line.characters.forEach((c) => (c.isComplete = true));
              res = { isComplete: true };
            }
          }
        }
        return state;
        // state.author = '123';
      }),
    );
    return res;
  },
  clearSelect() {
    set(
      produce((state: PoertyStore) => {
        state.lines.forEach((line) => {
          line.characters.forEach((c) => {
            c.isSeleted = false;
          });
        });
        return state;
      }),
    );
  },
}));
// usePoetryStore((state) => state.poetry);
export default usePoetryStore;

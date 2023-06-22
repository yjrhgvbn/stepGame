import idioms from '../assets/idiom/four.json';
import words from '../assets/word.json';
import { rest } from 'lodash';

interface Idiom {
  // id: string;
  word: string;
  explanation: string;
}

export function randomIdioms(length: number): Idiom[] {
  const res = [];
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * idioms.length);
    res.push(idioms[index]);
  }
  return res;
}

export function randomChinese(): string {
  const index = Math.floor(Math.random() * words.length);
  return words[index];
}

// 生产key值
export function getGenerateKey(prefix: string) {
  let currntKey = 0;
  return {
    getKey() {
      currntKey++;
      return prefix + currntKey;
    },
    restKey() {
      currntKey = 0;
    },
  };
}

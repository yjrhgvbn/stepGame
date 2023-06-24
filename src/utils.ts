import words from '../assets/word.json';

interface Idiom {
  // id: string;
  word: string;
  explanation: string;
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

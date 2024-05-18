import { Cheot, Kkeut, assembleHangul, getCheot, getGaundet } from "./hangul";
import { Prng, randInt, randNorm, sample, sampleByWeights } from "./random";

//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8
// ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ
// length: 19

//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0
// ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ
// length: 21

//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7
//   ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ
// length: 28

const dg: Record<number, number[]> = {
  2: [20, 0],
  3: [20, 1],
  6: [20, 4],
  7: [20, 5],
  9: [8, 0],
  10: [8, 1],
  11: [8, 5],
  12: [20, 8],
  14: [13, 4],
  15: [13, 5],
  16: [13, 20],
  17: [20, 13],
  19: [18, 20],
};

const possiblKkeut = ["", "ㄱ", "ㄴ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"] as const;

export function generateUnit(prng: Prng) {
  const c = randInt(prng, 0, 18);
  const g = randInt(prng, 0, 20);
  const k = Kkeut[sample(prng, possiblKkeut)];

  const dgd = dg[g] as number[] | undefined;
  const aOA = sampleByWeights(prng, [
    ["first", 0.125],
    ["last", 0.125],
    ["none", 1],
  ] as const);

  const length = randInt(prng, 0, 2);

  const g0 = dgd && aOA !== "first" ? dgd[0] : g;
  const k0 = length || dgd ? 0 : k;
  const s0 = assembleHangul([c, g0, k0]);

  let g1: number | undefined;
  if (dgd) g1 = dgd[aOA === "last" ? 0 : 1];
  else if (length) g1 = g;
  const s1 = g1 !== undefined ? assembleHangul([11, g1, 0]) : "";

  let g2: number | undefined;
  if (dgd) g2 = dgd[1];
  else if (length) g2 = g;
  const s2 = g2 ? assembleHangul([11, g2, k]) : "";

  return [`${s0}${s1.repeat(length)}${s2}`, length > 0] as const;
}

export function createJobsori(prng: Prng, appendSym = true) {
  const [[word0, l0], [word1, l1]] = [generateUnit(prng), generateUnit(prng)];
  let word = word0;
  if (word0.length === 1 || word1.length === 1) {
    word = `${word0}${word1}`;
  }

  if (word.length < 3) {
    word = word.repeat(2);
  } else if (
    word.length < 4 &&
    (getCheot(word, 1) !== Cheot["ㅇ"] ||
      getGaundet(word, 1) !== getGaundet(word, 2) ||
      getCheot(word, 1) !== getCheot(word, 2))
  ) {
    word = word.repeat(2);
  }

  const punc = appendSym ? sample(prng, ["!", "?", "~", "."]) : "";
  if (l0 || l1) {
    const nRepeat = Math.floor(Math.max(1, randNorm(prng, 1, 1)));
    return `${word}${punc.repeat(nRepeat)}`;
  }
  return `${word}${punc}`;
}

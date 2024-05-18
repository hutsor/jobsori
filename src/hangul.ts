const memoHI = { string: "", codePoints: {} as Record<number, number> };
export function getHangulIndex(string?: string | null, pos = 0) {
  if (!string) return -1;
  if (memoHI.string !== string) {
    memoHI.string = string;
    memoHI.codePoints = {};
  }
  if (pos < 0) pos = string.length + pos;
  if (pos in memoHI.codePoints) return memoHI.codePoints[pos];
  const cp = (string.codePointAt(pos) ?? 0xabff) - 0xac00;
  const safecp = cp < 11172 ? cp : -1;
  memoHI.codePoints[pos] = safecp;
  return safecp;
}
// cheotsori, gaundetsori, kkeutsori
export function getCheot(string?: string | null, pos = 0) {
  const hangulIndex = getHangulIndex(string, pos);
  if (hangulIndex === -1) return -1;
  return Math.floor(hangulIndex / (21 * 28));
}

export enum Cheot {
  ㄱ = 0,
  ㄲ = 1,
  ㄴ = 2,
  ㄷ = 3,
  ㄸ = 4,
  ㄹ = 5,
  ㅁ = 6,
  ㅂ = 7,
  ㅃ = 8,
  ㅅ = 9,
  ㅆ = 10,
  ㅇ = 11,
  ㅈ = 12,
  ㅉ = 13,
  ㅊ = 14,
  ㅋ = 15,
  ㅌ = 16,
  ㅍ = 17,
  ㅎ = 18,
}

export function getGaundet(string?: string | null, pos = 0) {
  const hangulIndex = getHangulIndex(string, pos);
  if (hangulIndex === -1) return -1;
  return Math.floor((hangulIndex / 28) % 21);
}

export enum Gaundet {
  ㅏ = 0,
  ㅐ = 1,
  ㅑ = 2,
  ㅒ = 3,
  ㅓ = 4,
  ㅔ = 5,
  ㅕ = 6,
  ㅖ = 7,
  ㅗ = 8,
  ㅘ = 9,
  ㅙ = 10,
  ㅚ = 11,
  ㅛ = 12,
  ㅜ = 13,
  ㅝ = 14,
  ㅞ = 15,
  ㅟ = 16,
  ㅠ = 17,
  ㅡ = 18,
  ㅢ = 19,
  ㅣ = 20,
}

export function getKkeut(string?: string | null, pos = 0) {
  const hidx = getHangulIndex(string, pos);
  if (hidx === -1) return -1;
  return hidx % 28;
}

export enum Kkeut {
  "" = 0,
  ㄱ = 1,
  ㄲ = 2,
  ㄳ = 3,
  ㄴ = 4,
  ㄵ = 5,
  ㄶ = 6,
  ㄷ = 7,
  ㄹ = 8,
  ㄺ = 9,
  ㄻ = 10,
  ㄼ = 11,
  ㄽ = 12,
  ㄾ = 13,
  ㄿ = 14,
  ㅀ = 15,
  ㅁ = 16,
  ㅂ = 17,
  ㅄ = 18,
  ㅅ = 19,
  ㅆ = 20,
  ㅇ = 21,
  ㅈ = 22,
  ㅊ = 23,
  ㅋ = 24,
  ㅌ = 25,
  ㅍ = 26,
  ㅎ = 27,
}

export function disassembleHangul(string: string, pos: number) {
  const hangulIndex = getHangulIndex(string, pos);
  if (hangulIndex === -1) return [-1, -1, -1] as const;
  return [
    Math.floor(hangulIndex / (21 * 28)),
    Math.floor((hangulIndex / 28) % 21),
    hangulIndex % 28,
  ] as const;
}

export function assembleHangul([cheot, ga, ggeut]: [number, number, number]) {
  cheot = Math.min(Math.max(0, cheot), 18);
  ga = Math.min(Math.max(0, ga), 20);
  ggeut = Math.min(Math.max(0, ggeut), 27);
  try {
    return String.fromCodePoint(0xac00 + cheot * 21 * 28 + ga * 28 + ggeut);
  } catch (error) {
    console.error(`Failed to assemble. value was: ${cheot}, ${ga}, ${ggeut}`);
    throw error;
  }
}

// ㄱㄴㄷㄹㅁㅂㅅㅇ
// ㅏㅔㅗㅣ
//   ㄱㄴㄹㅁㅂㅅㅇ
const c8 = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"] as const;
const g4 = ["ㅏ", "ㅔ", "ㅗ", "ㅣ"] as const;
const k8 = ["", "ㄱ", "ㄴ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"] as const;
const code256 = Array<string>(256);
const invCode256: Record<string, number> = {};
for (let i = 0; i < 256; ++i) {
  // 3/2/3
  const [n0, n1, n2] = [i >> 5, (i & 0b00011000) >> 3, i & 0b00000111];
  const geul = assembleHangul([Cheot[c8[n0]], Gaundet[g4[n1]], Kkeut[k8[n2]]]);
  code256[i] = geul;
  invCode256[code256[i]] = i;
}

export const encodeHG256 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += code256[bytes[i]];
  return hex;
};

export const decodeHG256 = (text: string) => {
  if (text.length % 2) throw new Error("Malformed Hex");
  const bytes = new Uint8Array(Math.ceil(text.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = invCode256[text.substring(i * 2, (i + 1) * 2)];
  }
  return bytes.buffer;
};

Object.assign(window, { encodeHG256, decodeHG256 });

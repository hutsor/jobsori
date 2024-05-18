const hexmap = Array(256);
const invHexmap: Record<string, number> = {};
for (let i = 0; i < 256; ++i) {
  hexmap[i] = i.toString(16).padStart(2, "0");
  invHexmap[hexmap[i]] = i;
}

export const encodeHex = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += hexmap[bytes[i]];
  return hex;
};

export const decodeHex = (text: string) => {
  if (text.length % 2) throw new Error("Malformed Hex");
  const bytes = new Uint8Array(Math.ceil(text.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = invHexmap[text.substring(i * 2, (i + 1) * 2)];
  }
  return bytes.buffer;
};

export function generateSeed() {
  return encodeHex(crypto.getRandomValues(new BigUint64Array(1)).buffer);
}

function murmurHash3(h: bigint) {
  h ^= h >> 33n;
  h *= 0xff51afd7ed558ccdn;
  h ^= h >> 33n;
  h *= 0xc4ceb9fe1a85ec53n;
  h ^= h >> 33n;
  return h;
}

function setSeed(seed: string | ArrayBuffer, state = new BigUint64Array(2)) {
  const buffer = typeof seed === "string" ? decodeHex(seed) : seed;
  if (buffer.byteLength !== 8) throw new Error("Malformed seed");
  const dv64 = new DataView(buffer);

  state[0] = murmurHash3(dv64.getBigUint64(0, false));
  state[1] = murmurHash3(~state[0]);
  return state;
}

function xorShift128(state: BigUint64Array) {
  let s1 = state[0];
  const s0 = state[1];
  state[0] = s0;
  s1 ^= s1 << 23n;
  s1 ^= s1 >> 17n;
  s1 ^= s0;
  s1 ^= s0 >> 26n;
  state[1] = s1;
  return state;
}

export function createPrng(seed: string | ArrayBuffer) {
  const state = setSeed(seed);
  return () => xorShift128(state);
}

export type Prng = () => ReturnType<typeof xorShift128>;

export function uniform(prng: Prng) {
  const dv = new DataView(new ArrayBuffer(8));
  const kExponentBits = 0x3ff0000000000000n;
  const random = (prng()[0] >> 12n) | kExponentBits;
  dv.setBigUint64(0, random, true);
  return dv.getFloat64(0, true) - 1;
}

Object.assign(window, { encodeHex, decodeHex, createPrng, uniform });

export const randInt = (prng: Prng, min: number, max: number) =>
  Math.floor(uniform(prng) * (max + 1 - min)) + min;

export function sampleByWeights<T>(
  prng: Prng,
  weights: ArrayLike<[T, number]>,
) {
  const accws: number[] = [];
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    const r = weights[i][1];
    accws.push((accws.at(-1) ?? 0) + r);
    sum += r;
  }
  const v = uniform(prng) * sum;
  for (let i = 0; i < weights.length; i++) {
    if (v < accws[i]) return weights[i][0];
  }
  return weights[0]?.[0];
}

export const sampleIndex = (prng: Prng, array: { length: number }): number => {
  return randInt(prng, 0, array.length - 1);
};

export const sample = <T>(prng: Prng, array: ArrayLike<T>): T => {
  return array[randInt(prng, 0, array.length - 1)];
};

// Standard Normal variate using Box-Muller transform.
export function randNorm(prng: Prng, mean = 0, stdev = 1) {
  const u = 1 - uniform(prng); // Converting [0,1) to (0,1]
  const v = uniform(prng);
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

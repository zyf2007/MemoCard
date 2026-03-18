import { generateMD5 } from "./CryptoUtils";

export function generateQuestionBaseId(baseName: string) {
  return generateMD5(`${baseName.trim()}${new Date().toISOString()}`).slice(0, 8);
}

export function generateQuestionId(baseId: string, seed: string) {
  return `${baseId}${generateMD5(`${seed}${new Date().toISOString()}`).slice(0, 8)}`;
}

export function generateDeterministicQuestionId(baseId: string, seed: string) {
  return `${baseId}${generateMD5(seed).slice(0, 8)}`;
}

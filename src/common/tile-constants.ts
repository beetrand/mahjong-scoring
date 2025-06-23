// 麻雀牌の基本定数

/**
 * 34種類の牌とインデックスの対応表
 * インデックス 0-33 に対応する牌文字
 */
export const TILE_NAMES = [
  "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",  // 0-8: 萬子
  "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",  // 9-17: 筒子
  "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",  // 18-26: 索子
  "1z", "2z", "3z", "4z", "5z", "6z", "7z"               // 27-33: 字牌
] as const;

/**
 * 牌文字からインデックスへのマップ
 */
export const TILE_NAME_TO_INDEX: { [key: string]: number } = {
  // 萬子
  "1m": 0, "2m": 1, "3m": 2, "4m": 3, "5m": 4, "6m": 5, "7m": 6, "8m": 7, "9m": 8,
  // 筒子
  "1p": 9, "2p": 10, "3p": 11, "4p": 12, "5p": 13, "6p": 14, "7p": 15, "8p": 16, "9p": 17,
  // 索子
  "1s": 18, "2s": 19, "3s": 20, "4s": 21, "5s": 22, "6s": 23, "7s": 24, "8s": 25, "9s": 26,
  // 字牌
  "1z": 27, "2z": 28, "3z": 29, "4z": 30, "5z": 31, "6z": 32, "7z": 33
} as const;

/**
 * インデックスから牌文字を取得
 */
export function indexToTileName(index: number): string {
  if (index < 0 || index >= TILE_NAMES.length) {
    throw new Error(`Invalid tile index: ${index}`);
  }
  return TILE_NAMES[index];
}

/**
 * 牌文字からインデックスを取得
 */
export function tileNameToIndex(tileName: string): number {
  const index = TILE_NAME_TO_INDEX[tileName];
  if (index === undefined) {
    throw new Error(`Invalid tile name: ${tileName}`);
  }
  return index;
}

/**
 * スート別インデックス範囲
 */
export const SUIT_RANGES = {
  MAN: { start: 0, end: 8 },    // 萬子: 0-8
  PIN: { start: 9, end: 17 },   // 筒子: 9-17
  SOU: { start: 18, end: 26 },  // 索子: 18-26
  HONOR: { start: 27, end: 33 } // 字牌: 27-33
} as const;

/**
 * 字牌の詳細
 */
export const HONOR_TILES = {
  EAST: 27,   // 1z: 東
  SOUTH: 28,  // 2z: 南
  WEST: 29,   // 3z: 西
  NORTH: 30,  // 4z: 北
  WHITE: 31,  // 5z: 白
  GREEN: 32,  // 6z: 發
  RED: 33     // 7z: 中
} as const;

/**
 * 風牌と三元牌の境界
 */
export const WIND_DRAGON_BOUNDARY = 30; // 風牌は27-30、三元牌は31-33

/**
 * 最大インデックス
 */
export const MAX_TILE_INDEX = 33;

/**
 * インデックスがどのスートに属するかを判定
 */
export function getSuitFromIndex(index: number): 'man' | 'pin' | 'sou' | 'wind' | 'dragon' {
  if (index >= SUIT_RANGES.MAN.start && index <= SUIT_RANGES.MAN.end) return 'man';
  if (index >= SUIT_RANGES.PIN.start && index <= SUIT_RANGES.PIN.end) return 'pin';
  if (index >= SUIT_RANGES.SOU.start && index <= SUIT_RANGES.SOU.end) return 'sou';
  if (index >= HONOR_TILES.EAST && index <= WIND_DRAGON_BOUNDARY) return 'wind';
  if (index >= HONOR_TILES.WHITE && index <= HONOR_TILES.RED) return 'dragon';
  throw new Error(`Invalid tile index: ${index}`);
}

/**
 * スートとvalueからインデックスを計算
 */
export function calculateIndex(suit: 'man' | 'pin' | 'sou' | 'wind' | 'dragon', value: number): number {
  switch (suit) {
    case 'man':
      return SUIT_RANGES.MAN.start + value - 1;
    case 'pin':
      return SUIT_RANGES.PIN.start + value - 1;
    case 'sou':
      return SUIT_RANGES.SOU.start + value - 1;
    case 'wind':
      return HONOR_TILES.EAST + value - 1;
    case 'dragon':
      return HONOR_TILES.WHITE + value - 1;
    default:
      throw new Error(`Invalid suit: ${suit}`);
  }
}

/**
 * インデックスからスート内のvalueを計算
 */
export function getValueFromIndex(index: number): number {
  const suit = getSuitFromIndex(index);
  switch (suit) {
    case 'man':
      return index - SUIT_RANGES.MAN.start + 1;
    case 'pin':
      return index - SUIT_RANGES.PIN.start + 1;
    case 'sou':
      return index - SUIT_RANGES.SOU.start + 1;
    case 'wind':
      return index - HONOR_TILES.EAST + 1;
    case 'dragon':
      return index - HONOR_TILES.WHITE + 1;
  }
}
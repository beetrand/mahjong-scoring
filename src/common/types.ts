// 麻雀点数計算システム - 型定義

export const TileSuit = {
  MAN: 'man',      // 萬子 (1-9)
  PIN: 'pin',      // 筒子 (1-9) 
  SOU: 'sou',      // 索子 (1-9)
  WIND: 'wind',    // 風牌 (1=東,2=南,3=西,4=北)
  DRAGON: 'dragon' // 三元牌 (1=白,2=發,3=中)
} as const;
export type TileSuit = typeof TileSuit[keyof typeof TileSuit];

export const MentsuType = {
  SEQUENCE: 'sequence',  // 順子 (123)
  TRIPLET: 'triplet',    // 刻子 (111)
  QUAD: 'quad',          // 槓子 (1111)
  PAIR: 'pair'           // 対子 (11)
} as const;
export type MentsuType = typeof MentsuType[keyof typeof MentsuType];

export const WaitType = {
  RYANMEN: 'ryanmen',    // 両面待ち
  KANCHAN: 'kanchan',    // 嵌張待ち
  PENCHAN: 'penchan',    // 辺張待ち
  SHANPON: 'shanpon',    // 双碰待ち
  TANKI: 'tanki'         // 単騎待ち
} as const;
export type WaitType = typeof WaitType[keyof typeof WaitType];

export const HandType = {
  REGULAR: 'regular',        // 通常手
  CHITOITSU: 'chitoitsu',   // 七対子
  KOKUSHI: 'kokushi'        // 国士無双
} as const;
export type HandType = typeof HandType[keyof typeof HandType];

export const Wind = {
  EAST: 1,
  SOUTH: 2,
  WEST: 3,
  NORTH: 4
} as const;
export type Wind = typeof Wind[keyof typeof Wind];

export const Dragon = {
  WHITE: 1,
  GREEN: 2,
  RED: 3
} as const;
export type Dragon = typeof Dragon[keyof typeof Dragon];

// 牌の定数定義
export const TILE_NAMES = {
  WIND: { EAST: 1, SOUTH: 2, WEST: 3, NORTH: 4 },
  DRAGON: { WHITE: 1, GREEN: 2, RED: 3 }
} as const;

// ゲーム状況
export interface GameContext {
  readonly roundWind: Wind;
  readonly playerWind: Wind;
  readonly doraIndicators: string[];
  readonly uraDoraIndicators: string[];
  readonly hasRedDora: boolean;
}

// 符計算コンテキスト
export interface FuContext {
  gameContext: GameContext;
  winningTile: string;
  isTsumo: boolean;
  isOpenHand: boolean;
}

// 役判定コンテキスト
export interface YakuContext {
  gameContext: GameContext;
  winningTile: string;
  isTsumo: boolean;
  isRiichi: boolean;
  isOpenHand: boolean;
}

// ボーナス点数
export interface BonusPoints {
  riichiSticks: number;  // リーチ棒
  honbaSticks: number;   // 本場
}

// 手牌オプション
export interface HandOptions {
  openMelds?: string[];
  winningTile: string;
  isTsumo: boolean;
  isRiichi?: boolean;
  gameContext: GameContext;
}
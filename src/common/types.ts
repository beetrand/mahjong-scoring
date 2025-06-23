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

export const OpenMeldType = {
  CHI: 'chi',       // チー (順子)
  PON: 'pon',       // ポン (刻子)
  MINKAN: 'minkan', // 明槓
  KAKAN: 'kakan'    // 加槓
} as const;
export type OpenMeldType = typeof OpenMeldType[keyof typeof OpenMeldType];

export const MeldFrom = {
  KAMICHA: 'kamicha',   // 上家 (左隣)
  TOIMEN: 'toimen',     // 対面
  SHIMOCHA: 'shimocha'  // 下家 (右隣)
} as const;
export type MeldFrom = typeof MeldFrom[keyof typeof MeldFrom];

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

// シャンテン計算設定
export interface ShantenConfig {
  enableRegular?: boolean;      // 通常手計算を有効にするか（デフォルト: true）
  enableChitoitsu?: boolean;    // 七対子計算を有効にするか（デフォルト: true）
  enableKokushi?: boolean;      // 国士無双計算を有効にするか（デフォルト: true）
}

// シャンテン計算オプション
export interface ShantenOptions {
  includeUsefulTiles?: boolean;        // 有効牌を計算に含めるか（デフォルト: false）
  includeWaitType?: boolean;           // 待ちの形を含めるか（デフォルト: false）
  handTypes?: HandType[];              // 計算対象の手牌タイプ（未指定時は全て）
}

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

// 手牌オプション（Component配列を使用）
export interface HandOptions {
  drawnTile: string;        // ツモ牌（和了時は和了牌、非和了時も意味を持つ）
  isTsumo: boolean;
  isRiichi?: boolean;
  gameContext: GameContext;
}

// 手牌状態の種類
export const HandState = {
  WINNING: 'winning',        // 上がり (-1シャンテン)
  TENPAI: 'tenpai',         // テンパイ (0シャンテン)
  INCOMPLETE: 'incomplete'   // 未完成 (1シャンテン以上)
} as const;
export type HandState = typeof HandState[keyof typeof HandState];

// 手牌分析結果
export interface HandAnalysisResult {
  readonly handState: HandState;
  readonly shanten: number;
  readonly bestHandType: HandType;
  readonly usefulTiles: string[];        // 有効牌の文字列表現
  readonly usefulTileCount: number;      // 有効牌の枚数（残り枚数考慮）
  readonly message: string;              // 状況説明メッセージ
}
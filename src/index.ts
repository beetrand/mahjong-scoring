// 麻雀点数計算システム メインエクスポート

export { Tile } from './common/tile';
export { Mentsu } from './common/mentsu';
export { HandAnalyzer } from './tensuu/hand-analyzer';
export { ShantenCalculator } from './tensuu/shanten-calculator';
export { 
  Yaku, 
  YakuDetector,
  RiichiYaku,
  TsumoYaku,
  PinfuYaku,
  TanyaoYaku,
  YakuhaiYaku,
  ChitoitsuYaku,
  IttsuYaku,
  SanankoYaku,
  KokushimusouYaku,
  SuuankoYaku,
  DaisangenYaku
} from './tensuu/yaku';
export { 
  FuCalculator, 
  ScoreCalculator, 
  PaymentCalculator, 
  ScoringResult,
  LimitHandType
} from './tensuu/scoring';
import { MahjongScorer } from './tensuu/mahjong-scorer';
export { MahjongScorer, Hand } from './tensuu/mahjong-scorer';
export { 
  TileSuit,
  MentsuType,
  WaitType,
  HandType,
  Wind,
  Dragon,
  TILE_NAMES
} from './common/types';

// 型のエクスポート
export type { MentsuCombination } from './tensuu/hand-analyzer';
export type { ShantenResult } from './tensuu/shanten-calculator';
export type { YakuResult } from './tensuu/yaku';
export type { 
  FuResult,
  FuBreakdown,
  ScoreResult,
  PaymentResult
} from './tensuu/scoring';
export type { 
  GameContext,
  FuContext,
  YakuContext,
  BonusPoints,
  HandOptions
} from './common/types';

// 便利な関数をエクスポート
export function createGameContext(
  roundWind: number = 1,
  playerWind: number = 1,
  doraIndicators: string[] = [],
  uraDoraIndicators: string[] = [],
  hasRedDora: boolean = false
) {
  return {
    roundWind: roundWind as any,
    playerWind: playerWind as any,
    doraIndicators,
    uraDoraIndicators,
    hasRedDora
  };
}

export function createDefaultScorer() {
  return new MahjongScorer();
}
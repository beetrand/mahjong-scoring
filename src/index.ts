// 麻雀点数計算システム メインエクスポート

export { Tile } from './common/tile';
export { Component, ComponentStack, ComponentType } from './common/component';
export type { ComponentCombination } from './common/component';
export { ShantenCalculator } from './tensuu/shanten-calculator';
export { UsefulTilesCalculator } from './tensuu/useful-tiles-calculator';
export { HandAnalyzer } from './tensuu/hand-analyzer';
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
export { Hand } from './common/hand';
export { HandParser } from './common/hand-parser';
import { MahjongScorer } from './tensuu/mahjong-scorer';
import { Hand } from './common/hand';
export { MahjongScorer };
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
export type { ShantenAnalysisResult } from './common/types';
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

// 便利関数: Handオブジェクトからシャンテン数を計算
export function analyzeMeldHand(handStr: string, options: {
  drawnTile: string;        // ツモ牌（和了時は和了牌、非和了時も意味を持つ）
  isTsumo: boolean;
  gameContext: any;
  isRiichi?: boolean;
}) {
  const hand = Hand.fromString(handStr, options);
  const scorer = new MahjongScorer();
  return scorer.analyzeHandState(hand);
}


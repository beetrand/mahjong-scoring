// 麻雀点数計算統合クラス

import { Tile } from '../common/tile';
import { HandAnalyzer } from './hand-analyzer';
import { YakuDetector } from './yaku';
import { FuCalculator, ScoreCalculator, PaymentCalculator, ScoringResult } from './scoring';
import { ShantenCalculator } from './shanten-calculator';
import type { MentsuCombination } from './hand-analyzer';
import type { YakuResult } from './yaku';
import type { ShantenResult } from './shanten-calculator';
import type { GameContext, YakuContext, FuContext, BonusPoints, HandOptions } from '../common/types';

export class Hand {
  public readonly tiles: Tile[];
  public readonly openMelds: string[];
  public readonly winningTile: Tile;
  public readonly isTsumo: boolean;
  public readonly isRiichi: boolean;
  public readonly gameContext: GameContext;

  constructor(tiles: Tile[], options: HandOptions) {
    this.tiles = tiles;
    this.openMelds = options.openMelds || [];
    this.winningTile = Tile.fromString(options.winningTile);
    this.isTsumo = options.isTsumo;
    this.isRiichi = options.isRiichi || false;
    this.gameContext = options.gameContext;
    
    // 手牌数の検証
    if (this.tiles.length !== 14) {
      throw new Error(`Invalid hand size: expected 14 tiles, got ${this.tiles.length}`);
    }
    
    // 和了牌が手牌に含まれているか検証
    const hasWinningTile = this.tiles.some(tile => tile.equalsIgnoreRed(this.winningTile));
    if (!hasWinningTile) {
      throw new Error(`Winning tile ${this.winningTile.toString()} not found in hand`);
    }
  }

  public getAllTiles(): Tile[] {
    return [...this.tiles];
  }

  public getConcealedTiles(): Tile[] {
    // 簡略化: 鳴きがある場合の処理は省略
    return this.tiles;
  }

  public getTileCount(): number {
    return this.tiles.length;
  }

  public isOpenHand(): boolean {
    return this.openMelds.length > 0;
  }

  public static create(tiles: Tile[], options: HandOptions): Hand {
    return new Hand(tiles, options);
  }

  public static fromString(tilesStr: string, options: HandOptions): Hand {
    const tiles = Tile.parseHandString(tilesStr);
    return new Hand(tiles, options);
  }
}

export class MahjongScorer {
  private handAnalyzer: HandAnalyzer;
  private yakuDetector: YakuDetector;
  private fuCalculator: FuCalculator;
  private scoreCalculator: ScoreCalculator;
  private paymentCalculator: PaymentCalculator;
  private shantenCalculator: ShantenCalculator;

  constructor() {
    this.handAnalyzer = new HandAnalyzer();
    this.yakuDetector = new YakuDetector();
    this.fuCalculator = new FuCalculator();
    this.scoreCalculator = new ScoreCalculator();
    this.paymentCalculator = new PaymentCalculator();
    this.shantenCalculator = new ShantenCalculator();
  }

  public scoreHand(hand: Hand, bonuses: BonusPoints = { riichiSticks: 0, honbaSticks: 0 }): ScoringResult {
    // 1. 手牌解析
    const handCombinations = this.handAnalyzer.findAllMentsuCombinations(
      hand.getAllTiles(), 
      { winningTile: hand.winningTile }
    );
    
    if (handCombinations.length === 0) {
      throw new Error('No valid winning hand found');
    }

    // 2. 最適な組み合わせを選択
    const bestResult = this.findBestCombination(handCombinations, hand);
    
    if (!bestResult) {
      throw new Error('No valid yaku found');
    }

    const { combination, yakuResults, totalHan } = bestResult;

    // 3. 符計算
    const fuContext: FuContext = {
      gameContext: hand.gameContext,
      winningTile: hand.winningTile.toString(),
      isTsumo: hand.isTsumo,
      isOpenHand: hand.isOpenHand()
    };
    const fuResult = this.fuCalculator.calculateFu(combination, fuContext);

    // 4. 点数計算
    const isDealer = hand.gameContext.playerWind === 1; // 東家
    const scoreResult = this.scoreCalculator.calculateScore(totalHan, fuResult.totalFu, isDealer);

    // 5. 支払い計算
    const paymentResult = this.paymentCalculator.calculatePayments(
      scoreResult,
      hand.isTsumo,
      isDealer,
      bonuses
    );

    return ScoringResult.create(
      handCombinations,
      combination,
      yakuResults,
      fuResult,
      scoreResult,
      paymentResult
    );
  }

  private findBestCombination(
    combinations: MentsuCombination[], 
    hand: Hand
  ): { combination: MentsuCombination, yakuResults: YakuResult[], totalHan: number } | null {
    let bestResult: { combination: MentsuCombination, yakuResults: YakuResult[], totalHan: number } | null = null;
    let maxScore = 0;

    for (const combination of combinations) {
      const yakuContext: YakuContext = {
        gameContext: hand.gameContext,
        winningTile: hand.winningTile.toString(),
        isTsumo: hand.isTsumo,
        isRiichi: hand.isRiichi,
        isOpenHand: hand.isOpenHand()
      };

      const yakuResults = this.yakuDetector.detectYaku(combination, yakuContext);
      const totalHan = this.yakuDetector.calculateTotalHan(yakuResults);

      if (totalHan > 0) {
        const fuContext: FuContext = {
          gameContext: hand.gameContext,
          winningTile: hand.winningTile.toString(),
          isTsumo: hand.isTsumo,
          isOpenHand: hand.isOpenHand()
        };
        const fuResult = this.fuCalculator.calculateFu(combination, fuContext);
        const isDealer = hand.gameContext.playerWind === 1;
        const scoreResult = this.scoreCalculator.calculateScore(totalHan, fuResult.totalFu, isDealer);

        if (scoreResult.finalScore > maxScore) {
          maxScore = scoreResult.finalScore;
          bestResult = { combination, yakuResults, totalHan };
        }
      }
    }

    return bestResult;
  }

  public calculateShanten(tiles: Tile[]): ShantenResult {
    return this.shantenCalculator.calculateMinimumShanten(tiles);
  }

  public isWinningHand(tiles: Tile[]): boolean {
    return this.handAnalyzer.isWinningHand(tiles);
  }

  // 便利メソッド - 14枚の手牌文字列を期待
  public scoreHandFromString(
    tilesStr: string,
    winningTile: string,
    isTsumo: boolean,
    gameContext: GameContext,
    options: {
      isRiichi?: boolean;
      openMelds?: string[];
      bonuses?: BonusPoints;
    } = {}
  ): ScoringResult {
    const tiles = Tile.parseHandString(tilesStr);
    
    if (tiles.length !== 14) {
      throw new Error(`Hand string must represent exactly 14 tiles, got ${tiles.length}`);
    }

    const hand = Hand.fromString(tilesStr, {
      winningTile,
      isTsumo,
      gameContext,
      isRiichi: options.isRiichi || false,
      openMelds: options.openMelds || []
    });

    return this.scoreHand(hand, options.bonuses || { riichiSticks: 0, honbaSticks: 0 });
  }

  public calculateShantenFromString(tilesStr: string): ShantenResult {
    const tiles = Tile.parseHandString(tilesStr);
    return this.calculateShanten(tiles);
  }

  // デバッグ用
  public analyzeHand(tiles: Tile[]): {
    combinations: MentsuCombination[];
    isWinning: boolean;
    shanten: ShantenResult;
  } {
    const combinations = this.handAnalyzer.findAllMentsuCombinations(tiles);
    const isWinning = combinations.length > 0;
    const shanten = this.calculateShanten(tiles.slice(0, 13)); // シャンテン計算は13枚

    return {
      combinations,
      isWinning,
      shanten
    };
  }
}
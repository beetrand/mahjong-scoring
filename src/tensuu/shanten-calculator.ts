// 新しいシャンテン数計算統合クラス

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { HandType, WaitType } from '../common/types';
import type { ShantenConfig, ShantenOptions } from '../common/types';

import { BaseShantenCalculator } from './base-shanten-calculator';
import { UsefulTilesCalculator } from './useful-tiles-calculator';
import { MentsuCombinationFinder } from './mentsu-combination-finder';
import type { MentsuCombination } from './mentsu-combination-finder';

// 型をエクスポート
export type { MentsuCombination } from './mentsu-combination-finder';

// 軽量シャンテン結果（基本情報のみ）
export interface BasicShantenResult {
  readonly shanten: number;
  readonly handType: HandType;
}

// 詳細シャンテン結果（全情報含む）
export interface DetailedShantenResult extends BasicShantenResult {
  readonly regularShanten: number;
  readonly chitoitsuShanten: number;
  readonly kokushiShanten: number;
  usefulTiles?: Tile[];
  mentsuCombinations?: MentsuCombination[];
  waitType?: WaitType;
}

/**
 * シャンテン数計算統合クラス
 * 各計算機を統合し、設定とキャッシュを管理
 */
export class ShantenCalculator {
  private config: ShantenConfig;
  private cache = new Map<string, BasicShantenResult>();
  
  // 各計算機のインスタンス
  private baseShantenCalculator: BaseShantenCalculator;
  private usefulTilesCalculator: UsefulTilesCalculator;
  private mentsuCombinationFinder: MentsuCombinationFinder;

  constructor(config: ShantenConfig = {}) {
    this.config = {
      enableRegular: true,
      enableChitoitsu: true,
      enableKokushi: true,
      cacheResults: false,
      ...config
    };
    
    // 各計算機を初期化
    this.baseShantenCalculator = new BaseShantenCalculator();
    this.usefulTilesCalculator = new UsefulTilesCalculator();
    this.mentsuCombinationFinder = new MentsuCombinationFinder();
  }

  /**
   * 軽量シャンテン数計算（基本情報のみ）
   * 最も高速な計算で、シャンテン数と最適手牌タイプのみを返す
   */
  public calculateShanten(hand: Hand): number {
    const basicResult = this.calculateBasicShanten(hand);
    return basicResult.shanten;
  }

  /**
   * 基本シャンテン結果計算
   * シャンテン数と最適手牌タイプを返す
   * @param hand 手牌オブジェクト（副露情報含む）
   */
  public calculateBasicShanten(hand: Hand): BasicShantenResult {
    const tiles = hand.getEffectiveTilesForShanten();
    const meldCount = hand.getMeldCount();
    
    // 副露を考慮した正しいタイル数検証
    const expectedCount = hand.calculateExpectedTileCount();
    if (tiles.length !== expectedCount && tiles.length !== expectedCount - 1) {
      throw new Error(`Hand must have ${expectedCount} or ${expectedCount - 1} concealed tiles for shanten calculation, got ${tiles.length}`);
    }

    const cacheKey = this.generateCacheKey(tiles, meldCount);
    if (this.config.cacheResults && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const results: { shanten: number; handType: HandType }[] = [];

    if (this.config.enableRegular) {
      results.push({
        shanten: this.baseShantenCalculator.calculateRegularShantenFromHand(hand),
        handType: HandType.REGULAR
      });
    }

    if (this.config.enableChitoitsu) {
      results.push({
        shanten: this.baseShantenCalculator.calculateChitoitsuShantenFromHand(hand),
        handType: HandType.CHITOITSU
      });
    }

    if (this.config.enableKokushi) {
      results.push({
        shanten: this.baseShantenCalculator.calculateKokushiShantenFromHand(hand),
        handType: HandType.KOKUSHI
      });
    }

    if (results.length === 0) {
      throw new Error('No hand types enabled for calculation');
    }

    // 最小シャンテン数とその手牌タイプを選択
    const bestResult = results.reduce((best, current) => 
      current.shanten < best.shanten ? current : best
    );

    const result: BasicShantenResult = {
      shanten: bestResult.shanten,
      handType: bestResult.handType
    };

    if (this.config.cacheResults) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * 詳細シャンテン結果計算
   * オプションに応じて有効牌や面子組み合わせも含む
   * @param hand 手牌オブジェクト（副露情報含む）
   * @param options 計算オプション
   */
  public calculateShantenDetailed(hand: Hand, options: ShantenOptions = {}): DetailedShantenResult {
    const tiles = hand.getEffectiveTilesForShanten();
    
    const expectedCount = hand.calculateExpectedTileCount();
    if (tiles.length !== expectedCount && tiles.length !== expectedCount - 1) {
      throw new Error(`Hand must have ${expectedCount} or ${expectedCount - 1} concealed tiles for shanten calculation, got ${tiles.length}`);
    }

    // 基本シャンテン計算
    const basicResult = this.calculateBasicShanten(hand);

    // 各手牌タイプのシャンテン数を計算（HandベースAPI使用）
    const regularShanten = this.config.enableRegular !== false ? 
      this.baseShantenCalculator.calculateRegularShantenFromHand(hand) : Infinity;
    const chitoitsuShanten = this.config.enableChitoitsu !== false ? 
      this.baseShantenCalculator.calculateChitoitsuShantenFromHand(hand) : Infinity;
    const kokushiShanten = this.config.enableKokushi !== false ? 
      this.baseShantenCalculator.calculateKokushiShantenFromHand(hand) : Infinity;

    const result: DetailedShantenResult = {
      shanten: basicResult.shanten,
      handType: basicResult.handType,
      regularShanten,
      chitoitsuShanten,
      kokushiShanten
    };

    // オプションに応じて追加計算
    if (options.includeUsefulTiles) {
      result.usefulTiles = this.usefulTilesCalculator.calculateUsefulTiles(tiles, basicResult.handType);
    }

    if (options.includeMentsuCombinations && basicResult.shanten === -1) {
      result.mentsuCombinations = this.mentsuCombinationFinder.findAllCombinations(tiles);
    }

    if (options.includeWaitType && basicResult.shanten <= 0) {
      result.waitType = this.calculateWaitType(tiles, basicResult.handType);
    }

    return result;
  }

  /**
   * 有効牌を独立して計算
   */
  public calculateUsefulTiles(hand: Hand, targetHandType?: HandType): Tile[] {
    const tiles = hand.getEffectiveTilesForShanten();
    return this.usefulTilesCalculator.calculateUsefulTiles(tiles, targetHandType);
  }


  /**
   * 面子組み合わせを独立して計算
   */
  public findAllMentsuCombinationsFromHand(hand: Hand): MentsuCombination[] {
    const tiles = hand.getEffectiveTilesForShanten();
    return this.mentsuCombinationFinder.findAllCombinations(tiles);
  }

  /**
   * Hand オブジェクトのシャンテン数を計算（副露対応）
   */
  public calculateHandShanten(hand: Hand): DetailedShantenResult {
    const detailedResult = this.calculateShantenDetailed(hand, {
      includeUsefulTiles: true,
      includeMentsuCombinations: false,
      includeWaitType: true
    });

    return detailedResult;
  }

  /**
   * Hand オブジェクトが和了形かチェック
   */
  public isWinningHand(hand: Hand): boolean {
    const shantenResult = this.calculateHandShanten(hand);
    return shantenResult.shanten === -1;
  }

  /**
   * 待ちの形を計算（簡易実装）
   */
  private calculateWaitType(_tiles: Tile[], handType: HandType): WaitType {
    // 簡易実装：手牌タイプに基づく基本的な待ち
    switch (handType) {
      case HandType.CHITOITSU:
        return WaitType.TANKI;
      case HandType.KOKUSHI:
        return WaitType.TANKI;
      default:
        return WaitType.RYANMEN; // デフォルト
    }
  }

  /**
   * キャッシュキーを生成
   */
  private generateCacheKey(tiles: Tile[], meldCount: number = 0): string {
    const tileKey = tiles
      .map(tile => tile.toString())
      .sort()
      .join(',');
    return `${tileKey}:m${meldCount}`;
  }

  /**
   * キャッシュをクリア
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 設定を更新
   */
  public updateConfig(newConfig: Partial<ShantenConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (!this.config.cacheResults) {
      this.clearCache();
    }
  }
}
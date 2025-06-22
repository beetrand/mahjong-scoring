// 新しいシャンテン数計算統合クラス

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { HandType, WaitType } from '../common/types';
import type { ShantenOptions } from '../common/types';
import { TileCount } from '../common/tile-count';

import { UsefulTilesCalculator } from './useful-tiles-calculator';
import { MentsuCombinationFinder } from './mentsu-combination-finder';
import type { MentsuCombination } from './mentsu-combination-finder';

// 型をエクスポート
export type { MentsuCombination } from './mentsu-combination-finder';

/**
 * 通常手シャンテン計算の結果
 */
export interface RegularShantenResult {
  shanten: number;
  candidates: TileCount[];  // 最適な面子構成の候補リスト（残り牌のTileCount）
}


// 詳細シャンテン結果（全情報含む）
export interface ShantenResult {
  readonly shanten: number;
  readonly handType: HandType;
  readonly regularShanten: number;
  readonly chitoitsuShanten: number;
  readonly kokushiShanten: number;
  usefulTiles?: Tile[];
  mentsuCombinations?: MentsuCombination[];
  waitType?: WaitType;
}

/**
 * シャンテン数計算統合クラス
 * 各計算機を統合
 */
export class ShantenCalculator {
  // 各計算機のインスタンス
  private usefulTilesCalculator: UsefulTilesCalculator;
  private mentsuCombinationFinder: MentsuCombinationFinder;

  constructor() {
    // 各計算機を初期化
    this.usefulTilesCalculator = new UsefulTilesCalculator();
    this.mentsuCombinationFinder = new MentsuCombinationFinder();
  }

  /**
   * 軽量シャンテン数計算（基本情報のみ）
   * 最も高速な計算で、シャンテン数のみを返す
   */
  public calculateShantenNumber(hand: Hand): number {
    const basicResult = this.calculateShanten(hand,{includeUsefulTiles: false, includeMentsuCombinations: false, includeWaitType: false});
    return basicResult.shanten;
  }


  /**
   * シャンテン結果計算
   * オプションに応じて有効牌や面子組み合わせも含む
   * @param hand 手牌オブジェクト（副露情報含む）
   * @param options 計算オプション
   */
  public calculateShanten(hand: Hand, 
    options: ShantenOptions = {includeUsefulTiles: true, includeMentsuCombinations: false, includeWaitType: true}): ShantenResult {

    // 全タイプのシャンテン数を計算
    const regularShantenResult = this.calculateRegularShanten(hand);
    for(let candidate of regularShantenResult.candidates){
      console.log(candidate)
    }

    const chitoitsuShanten = this.calculateChitoitsuShanten(hand);
    const kokushiShanten = this.calculateKokushiShanten(hand);

    // 最小シャンテン数とその手牌タイプを決定
    let bestShanten = regularShantenResult.shanten;
    let bestHandType: HandType = HandType.REGULAR;

    if (chitoitsuShanten < bestShanten) {
      bestShanten = chitoitsuShanten;
      bestHandType = HandType.CHITOITSU;
    }

    if (kokushiShanten < bestShanten) {
      bestShanten = kokushiShanten;
      bestHandType = HandType.KOKUSHI;
    }

    const result: ShantenResult = {
      shanten: bestShanten,
      handType: bestHandType,
      regularShanten:regularShantenResult.shanten,
      chitoitsuShanten,
      kokushiShanten
    };

    // オプションに応じて追加計算
    const tiles = hand.getTehai();
    
    if (options.includeUsefulTiles) {
      result.usefulTiles = this.usefulTilesCalculator.calculateUsefulTiles(tiles, bestHandType);
    }

    if (options.includeMentsuCombinations && bestShanten === -1) {
      result.mentsuCombinations = this.mentsuCombinationFinder.findAllCombinations(tiles);
    }

    if (options.includeWaitType && bestShanten <= 0) {
      result.waitType = this.calculateWaitType(tiles, bestHandType);
    }

    return result;
  }

  /**
   * 有効牌を独立して計算
   */
  public calculateUsefulTiles(hand: Hand, targetHandType?: HandType): Tile[] {
    const tiles = hand.getTehai();
    return this.usefulTilesCalculator.calculateUsefulTiles(tiles, targetHandType);
  }


  /**
   * 面子組み合わせを独立して計算
   */
  public findAllMentsuCombinationsFromHand(hand: Hand): MentsuCombination[] {
    const tiles = hand.getTehai();
    return this.mentsuCombinationFinder.findAllCombinations(tiles);
  }

  /**
   * Hand オブジェクトが和了形かチェック
   */
  public isWinningHand(hand: Hand): boolean {
    const shantenResult = this.calculateShanten(hand);
    return shantenResult.shanten === -1;
  }

  /**
   * 通常手のシャンテン数を計算（Hand基盤）
   * @param hand 手牌オブジェクト
   * @return シャンテン数と最適な面子構成の候補リスト
   */
  public calculateRegularShanten(hand: Hand): RegularShantenResult {
    const handTileCount = hand.getTileCount();
    const meldCount = hand.getMeldCount();
    
    // 全牌一括バックトラッキングで最適解を探索
    const result = {
      minShanten: 8,
      optimalCandidates: [] as TileCount[]
    };
    
    this.tryExtractOptimalCombination(handTileCount.clone(), 0, meldCount, result);
    
    return {
      shanten: result.minShanten,
      candidates: result.optimalCandidates
    };
  }

  /**
   * 七対子のシャンテン数を計算
   * @param hand 手牌オブジェクト
   */
  public calculateChitoitsuShanten(hand: Hand): number {
    // 副露がある場合は七対子は成立しない
    if (!hand.canUseSpecialHands()) {
      return Infinity;
    }
    
    const handTileCount = hand.getTileCount();
    
    const toitsu = handTileCount.countToitsu();
    const kinds = handTileCount.countTilesWithAtLeast(1);
    
    // 3枚以上ある牌の無駄な枚数を計算
    let tooMany = 0;
    for (let i = 0; i < 34; i++) {
      const count = handTileCount.getCount(i);
      if (count >= 3) {
        tooMany += count - 2;
      }
    }

    // 七対子は7種類のペアが必要
    // 同じ牌が3枚以上あると効率が悪い
    if (kinds < 7) {
      return 6 - toitsu + (7 - kinds);
    }

    return 6 - toitsu + tooMany;
  }

  /**
   * 国士無双のシャンテン数を計算
   * @param hand 手牌オブジェクト
   */
  public calculateKokushiShanten(hand: Hand): number {
    // 副露がある場合は国士無双は成立しない
    if (!hand.canUseSpecialHands()) {
      return Infinity;
    }
    
    const handTileCount = hand.getTileCount();
    
    // 国士無双対象牌のインデックス：端牌＋字牌
    const terminalIndices = [
      0, 8,    // 1m, 9m
      9, 17,   // 1p, 9p  
      18, 26,  // 1s, 9s
      27, 28, 29, 30, 31, 32, 33 // 1z-7z
    ];

    let kinds = 0;  // 異なり種類数
    let toitsu = 0;  // 対子数

    for (const index of terminalIndices) {
      const count = handTileCount.getCount(index);
      if (count >= 1) {
        kinds++;
        if (count >= 2) {
          toitsu++;
        }
      }
    }

    // 13種類揃っている場合
    if (kinds >= 13) {
      return toitsu >= 1 ? -1 : 0; // 対子があれば和了、なければテンパイ
    }

    // 13種類未満の場合
    return 13 - kinds - (toitsu > 0 ? 1 : 0);
  }




  /**
   * 残った牌から対子と搭子をカウント
   */
  private countRemainingTiles(tileCount: TileCount): { toitsu: number, taatsu: number } {
    let toitsu = 0;
    let taatsu = 0;
    
    // 全ての牌（数牌+字牌）の対子をカウント
    for (let i = 0; i < 34; i++) {
      const count = tileCount.getCount(i);
      if (count >= 2) {
        toitsu++;
        tileCount.decrement(i, 2);
      }
    }
    
    // 数牌の搭子をカウント（字牌は搭子にならない）
    for (let suit = 0; suit < 3; suit++) {
      const start = suit * 9;
      
      // 隣接搭子をカウント
      for (let i = start; i < start + 8; i++) {
        const count1 = tileCount.getCount(i);
        const count2 = tileCount.getCount(i + 1);
        if (count1 > 0 && count2 > 0) {
          taatsu++;
          tileCount.decrement(i);
          tileCount.decrement(i + 1);
        }
      }
      
      // 飛び搭子をカウント
      for (let i = start; i < start + 7; i++) {
        const count1 = tileCount.getCount(i);
        const count3 = tileCount.getCount(i + 2);
        if (count1 > 0 && count3 > 0) {
          taatsu++;
          tileCount.decrement(i);
          tileCount.decrement(i + 2);
        }
      }
    }
    
    return { toitsu, taatsu };
  }

  /**
   * 全牌一括での最適組み合わせ抽出（字牌含む）
   */
  private tryExtractOptimalCombination(
    tiles: TileCount,
    position: number,
    currentMelds: number,
    result: { minShanten: number, optimalCandidates: TileCount[] }
  ): void {
    // 全ての位置を処理済みの場合
    if (position >= 34) {  // 全牌（0-33）
      // 残り牌から対子・搭子をカウント
      const { toitsu, taatsu } = this.countRemainingTiles(tiles.clone());
      
      // シャンテン数計算
      let shanten = 8 - (currentMelds * 2) - taatsu - toitsu;
      if (toitsu === 0) {
        shanten += 1;  // 雀頭なし
      }
      shanten = Math.max(shanten, -1);
      
      // 最適解の更新
      if (shanten < result.minShanten) {
        result.minShanten = shanten;
        result.optimalCandidates.length = 0;
        result.optimalCandidates.push(tiles.clone());
      } else if (shanten === result.minShanten) {
        result.optimalCandidates.push(tiles.clone());
      }
      return;
    }
    
    // 現在位置に牌がない場合は次へ
    if (tiles.getCount(position) === 0) {
      this.tryExtractOptimalCombination(tiles, position + 1, currentMelds, result);
      return;
    }
    
    // 刻子を試す（全ての位置で可能）
    if (tiles.getCount(position) >= 3) {
      tiles.decrement(position, 3);
      this.tryExtractOptimalCombination(tiles, position, currentMelds + 1, result);
      tiles.increment(position, 3);
    }
    
    // 順子を試す（数牌のみ、スート境界をチェック）
    if (position < 27 && this.canFormShuntsu(position) && 
        tiles.getCount(position) > 0 && 
        tiles.getCount(position + 1) > 0 && 
        tiles.getCount(position + 2) > 0) {
      tiles.decrement(position); tiles.decrement(position + 1); tiles.decrement(position + 2);
      this.tryExtractOptimalCombination(tiles, position, currentMelds + 1, result);
      tiles.increment(position); tiles.increment(position + 1); tiles.increment(position + 2);
    }
    
    // 何も取らずに次の位置へ
    this.tryExtractOptimalCombination(tiles, position + 1, currentMelds, result);
  }

  /**
   * 指定位置で順子を形成可能かチェック（スート境界考慮）
   */
  private canFormShuntsu(position: number): boolean {
    // 萬子: 0-6, 筒子: 9-15, 索子: 18-24 で順子形成可能
    return (position <= 6) || 
           (position >= 9 && position <= 15) || 
           (position >= 18 && position <= 24);
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
}

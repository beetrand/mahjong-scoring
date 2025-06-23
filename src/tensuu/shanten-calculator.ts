// 新しいシャンテン数計算統合クラス

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { HandType, WaitType } from '../common/types';
import type { ShantenOptions } from '../common/types';
import { TileCount } from '../common/tile-count';
import { SUIT_RANGES, MAX_TILE_INDEX } from '../common/tile-constants';

import { UsefulTilesCalculator } from './useful-tiles-calculator';
import { Component, ComponentType } from '../common/component';

/**
 * 面子の種類（レガシー互換性のため残存）
 */
export const MentsuType = {
  SHUNTSU: 'shuntsu',  // 順子
  KOUTSU: 'koutsu',    // 刻子
  TOITSU: 'toitsu'     // 対子（雀頭）
} as const;

export type MentsuType = typeof MentsuType[keyof typeof MentsuType];

/**
 * 面子情報（レガシー互換性のため残存、新規はComponentを使用）
 * @deprecated Use Component instead
 */
export interface MentsuInfo {
  type: MentsuType;
  tiles: number[];  // 牌のインデックス
}

/**
 * 残り牌の分析結果（Componentベース）
 */
export interface RemainingTileAnalysis {
  toitsu: number;
  taatsu: number;
  components: Component[];
}

/**
 * シャンテン計算の詳細情報
 */
export interface ShantenCalculationDetail {
  shanten: number;
  mentsuList: Component[];   // 使用した面子のリスト（Componentベース）
  remainingTiles: TileCount; // 残り牌
}

/**
 * 通常手シャンテン計算の結果
 */
export interface RegularShantenResult {
  shanten: number;
  candidates: TileCount[];  // 最適な面子構成の候補リスト（残り牌のTileCount）
  details?: ShantenCalculationDetail[];  // 詳細情報（オプション）
}


// 詳細シャンテン結果（全情報含む）
export interface ShantenResult {
  readonly shanten: number;
  readonly handType: HandType;
  readonly regularShanten: number;
  readonly chitoitsuShanten: number;
  readonly kokushiShanten: number;
  usefulTiles?: Tile[];
  waitType?: WaitType;
}

/**
 * シャンテン数計算統合クラス
 * 各計算機を統合
 */
export class ShantenCalculator {
  // 各計算機のインスタンス
  private usefulTilesCalculator: UsefulTilesCalculator;

  constructor() {
    // 各計算機を初期化
    this.usefulTilesCalculator = new UsefulTilesCalculator();
  }

  /**
   * 軽量シャンテン数計算（基本情報のみ）
   * 最も高速な計算で、シャンテン数のみを返す
   */
  public calculateShantenNumber(hand: Hand): number {
    const basicResult = this.calculateShanten(hand,{includeUsefulTiles: false, includeWaitType: false});
    return basicResult.shanten;
  }


  /**
   * シャンテン結果計算
   * オプションに応じて有効牌も含む
   * @param hand 手牌オブジェクト（副露情報含む）
   * @param options 計算オプション
   */
  public calculateShanten(hand: Hand, 
    options: ShantenOptions = {includeUsefulTiles: true, includeWaitType: true}): ShantenResult {

    // 全タイプのシャンテン数を計算
    const regularShantenResult = this.calculateRegularShanten(hand, true, true);


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
   * Hand オブジェクトが和了形かチェック
   */
  public isWinningHand(hand: Hand): boolean {
    const shantenResult = this.calculateShanten(hand);
    return shantenResult.shanten === -1;
  }

  /**
   * 通常手のシャンテン数を計算（Hand基盤）
   * @param hand 手牌オブジェクト
   * @param includeDetails 詳細情報を含めるか
   * @param debugLog デバッグログを出力するか
   * @return シャンテン数と最適な面子構成の候補リスト
   */
  public calculateRegularShanten(hand: Hand, includeDetails: boolean = false, debugLog: boolean = false): RegularShantenResult {
    const handTileCount = hand.getTileCount();
    const meldCount = hand.getMeldCount();
    
    // 全牌一括バックトラッキングで最適解を探索
    const result = {
      minShanten: 8,
      optimalCandidates: [] as TileCount[],
      optimalDetails: [] as ShantenCalculationDetail[]
    };
    
    this.tryExtractOptimalCombination(handTileCount.clone(), 0, meldCount, result, [], includeDetails);
    
    // デバッグログの出力
    if(debugLog && result.optimalDetails && result.optimalDetails.length > 0) {
      console.log(`\n=== シャンテン計算詳細 (${result.optimalDetails.length}パターン) ===`);
      for(let i = 0; i < result.optimalDetails.length; i++){
        const detail = result.optimalDetails[i];
        console.log(`\n--- パターン ${i + 1} ---`);
        console.log(`シャンテン数: ${detail.shanten}`);
        
        // 面子の表示
        const completeMentsu = detail.mentsuList.filter(c => c.isCompleteMentsu());
        const pairs = detail.mentsuList.filter(c => c.type === ComponentType.PAIR);
        
        if(completeMentsu.length > 0) {
          console.log(`面子: ${completeMentsu.map(c => c.toString()).join(' ')}`);
        }
        
        if(pairs.length > 0) {
          console.log(`雀頭: ${pairs.map(c => c.toString()).join(' ')}`);
        }
        
        // 残り牌をターツ・といつ・孤立牌に分類して表示
        const remainingResult = this.countRemainingTiles(detail.remainingTiles.clone(), true);
        if(remainingResult.analysis && remainingResult.analysis.components.length > 0) {
          const remainingPairs = remainingResult.analysis.components.filter(c => c.type === ComponentType.PAIR);
          const remainingTaatsu = remainingResult.analysis.components.filter(c => c.type === ComponentType.TAATSU);
          const remainingIsolated = remainingResult.analysis.components.filter(c => c.type === ComponentType.ISOLATED);
          
          if(remainingPairs.length > 0) {
            console.log(`残り対子: ${remainingPairs.map(c => c.toString()).join(' ')}`);
          }
          if(remainingTaatsu.length > 0) {
            console.log(`残り搭子: ${remainingTaatsu.map(c => c.toString()).join(' ')}`);
          }
          if(remainingIsolated.length > 0) {
            console.log(`残り孤立牌: ${remainingIsolated.map(c => c.toString()).join(' ')}`);
          }
        }
      }
      console.log('=== 詳細終了 ===\n');
    }
    
    return {
      shanten: result.minShanten,
      candidates: result.optimalCandidates,
      ...(includeDetails && { details: result.optimalDetails })
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
      SUIT_RANGES.MAN.start, SUIT_RANGES.MAN.end,    // 1m, 9m
      SUIT_RANGES.PIN.start, SUIT_RANGES.PIN.end,    // 1p, 9p  
      SUIT_RANGES.SOU.start, SUIT_RANGES.SOU.end,    // 1s, 9s
      ...Array.from({ length: SUIT_RANGES.HONOR.end - SUIT_RANGES.HONOR.start + 1 }, 
                     (_, i) => SUIT_RANGES.HONOR.start + i) // 1z-7z
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
   * 残った牌から対子と搭子をカウント（分析結果付き）
   */
  private countRemainingTiles(tileCount: TileCount, returnAnalysis: boolean = false): { toitsu: number, taatsu: number, analysis?: RemainingTileAnalysis } {
    let toitsu = 0;
    let taatsu = 0;
    const components: Component[] = returnAnalysis ? [] : [];
    
    // 全ての牌（数牌+字牌）の対子をカウント
    for (let i = 0; i <= MAX_TILE_INDEX; i++) {
      const count = tileCount.getCount(i);
      if (count >= 2) {
        toitsu++;
        tileCount.decrement(i, 2);
        if (returnAnalysis) {
          components.push(Component.create(ComponentType.PAIR, [i, i]));
        }
      }
    }
    
    // 数牌の搭子をカウント（字牌は搭子にならない）
    const suitRanges = [SUIT_RANGES.MAN, SUIT_RANGES.PIN, SUIT_RANGES.SOU];
    for (const suitRange of suitRanges) {
      const start = suitRange.start;
      const end = suitRange.end;
      
      // 隣接搭子をカウント
      for (let i = start; i < end; i++) {
        const count1 = tileCount.getCount(i);
        const count2 = tileCount.getCount(i + 1);
        if (count1 > 0 && count2 > 0) {
          taatsu++;
          tileCount.decrement(i);
          tileCount.decrement(i + 1);
          if (returnAnalysis) {
            components.push(Component.create(ComponentType.TAATSU, [i, i + 1]));
          }
        }
      }
      
      // 飛び搭子をカウント
      for (let i = start; i < end - 1; i++) {
        const count1 = tileCount.getCount(i);
        const count3 = tileCount.getCount(i + 2);
        if (count1 > 0 && count3 > 0) {
          taatsu++;
          tileCount.decrement(i);
          tileCount.decrement(i + 2);
          if (returnAnalysis) {
            components.push(Component.create(ComponentType.TAATSU, [i, i + 2]));
          }
        }
      }
    }
    
    // 残りの孤立牌（分析時のみ）
    if (returnAnalysis) {
      for (let i = 0; i < 34; i++) {
        const count = tileCount.getCount(i);
        if (count > 0) {
          for (let j = 0; j < count; j++) {
            components.push(Component.create(ComponentType.ISOLATED, [i]));
          }
        }
      }
    }
    
    const result = { toitsu, taatsu };
    if (returnAnalysis) {
      return {
        ...result,
        analysis: {
          toitsu,
          taatsu,
          components
        }
      };
    }
    return result;
  }

  /**
   * 全牌一括での最適組み合わせ抽出（字牌含む）
   */
  private tryExtractOptimalCombination(
    tiles: TileCount,
    position: number,
    currentMelds: number,
    result: { minShanten: number, optimalCandidates: TileCount[], optimalDetails?: ShantenCalculationDetail[] },
    currentMentsuList: Component[] = [],
    includeDetails: boolean = false
  ): void {
    // 全ての位置を処理済みの場合
    if (position >= 34) {  // 全牌（0-33）
      // 残り牌から対子・搭子をカウント
      const { toitsu, taatsu } = this.countRemainingTiles(tiles.clone());
      
      // シャンテン数計算
      let shanten = 8 - (currentMelds * 2) -  Math.min(taatsu + toitsu, 4 - currentMelds) - Math.min(toitsu, 1);
      shanten = Math.max(shanten, -1);
      
      // 最適解の更新
      if (shanten < result.minShanten) {
        result.minShanten = shanten;
        result.optimalCandidates.length = 0;
        result.optimalCandidates.push(tiles.clone());
        
        if (includeDetails) {
          result.optimalDetails = [{
            shanten,
            mentsuList: [...currentMentsuList],
            remainingTiles: tiles.clone()
          }];
        }
      } else if (shanten === result.minShanten) {
        result.optimalCandidates.push(tiles.clone());
        
        if (includeDetails && result.optimalDetails) {
          result.optimalDetails.push({
            shanten,
            mentsuList: [...currentMentsuList],
            remainingTiles: tiles.clone()
          });
        }
      }
      return;
    }
    
    // 現在位置に牌がない場合は次へ
    if (tiles.getCount(position) === 0) {
      this.tryExtractOptimalCombination(tiles, position + 1, currentMelds, result, currentMentsuList, includeDetails);
      return;
    }
    
    // 刻子を試す（全ての位置で可能）
    if (tiles.getCount(position) >= 3) {
      tiles.decrement(position, 3);
      
      if (includeDetails) {
        const component = Component.create(ComponentType.TRIPLET, [position, position, position]);
        currentMentsuList.push(component);
        this.tryExtractOptimalCombination(tiles, position, currentMelds + 1, result, currentMentsuList, includeDetails);
        currentMentsuList.pop();
      } else {
        this.tryExtractOptimalCombination(tiles, position, currentMelds + 1, result, currentMentsuList, includeDetails);
      }
      
      tiles.increment(position, 3);
    }
    
    // 順子を試す（数牌のみ、スート境界をチェック）
    if (position < 27 && this.canFormShuntsu(position) && 
        tiles.getCount(position) > 0 && 
        tiles.getCount(position + 1) > 0 && 
        tiles.getCount(position + 2) > 0) {
      tiles.decrement(position); tiles.decrement(position + 1); tiles.decrement(position + 2);
      
      if (includeDetails) {
        const component = Component.create(ComponentType.SEQUENCE, [position, position + 1, position + 2]);
        currentMentsuList.push(component);
        this.tryExtractOptimalCombination(tiles, position, currentMelds + 1, result, currentMentsuList, includeDetails);
        currentMentsuList.pop();
      } else {
        this.tryExtractOptimalCombination(tiles, position, currentMelds + 1, result, currentMentsuList, includeDetails);
      }
      
      tiles.increment(position); tiles.increment(position + 1); tiles.increment(position + 2);
    }
    
    // 何も取らずに次の位置へ
    this.tryExtractOptimalCombination(tiles, position + 1, currentMelds, result, currentMentsuList, includeDetails);
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

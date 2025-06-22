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

/**
 * スートごとの面子抽出結果
 */
interface SuitMentsuResult {
  melds: number;              // 抽出した面子数
  remainingTiles: TileCount[];  // 残り牌の候補リスト（TileCountで管理）
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
    const regularShanten = this.calculateRegularShanten(hand).shanten;
    const chitoitsuShanten = this.calculateChitoitsuShanten(hand);
    const kokushiShanten = this.calculateKokushiShanten(hand);

    // 最小シャンテン数とその手牌タイプを決定
    let bestShanten = regularShanten;
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
      regularShanten,
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
    
    // 各スートと字牌の面子を抽出
    const suitResults: SuitMentsuResult[] = [];
    let totalMelds = meldCount;  // 副露分を初期値として含める
    
    // 数牌の処理（萬子・筒子・索子）
    for (let suit = 0; suit < 3; suit++) {
      const suitCounts = handTileCount.getSuitCounts(['man', 'pin', 'sou'][suit] as any);
      const suitResult = this.extractSuitMentsu(suitCounts, suit);
      suitResults.push(suitResult);
      totalMelds += suitResult.melds;
    }
    
    // 字牌の面子を抽出
    let honorMelds = 0;
    const honorCounts = handTileCount.getHonorCounts();

    const honorRemaining = new TileCount();
    
    // 字牌から面子を抽出
    for (let i = 0; i < 7; i++) {
      let count = honorCounts[i];
      while (count >= 3) {
        honorMelds++;
        count -= 3;
      }
      honorRemaining.setCountByIndex(27 + i, count);
    }
    totalMelds += honorMelds;
    
    // 全ての組み合わせを生成し、最適なシャンテン数を計算
    let minShanten = 8;  // 最大シャンテン数
    const optimalCandidates: TileCount[] = [];
    
    // 各スートの残り牌パターンを組み合わせる
    const combinations = this.generateCombinations(suitResults, honorRemaining);
    
    for (const combination of combinations) {
      // 残り牌から対子・搭子をカウント
      const { pairs, taatsu } = this.countRemainingTiles(combination.clone());
      
      // シャンテン数 = 8 - 2×面子数 - 搭子数 - 対子数 + 雀頭なしペナルティ
      let shanten = 8 - (totalMelds * 2) - taatsu - pairs;
      
      // 雀頭の調整（対子が1つ以上あれば雀頭ありとみなす）
      if (pairs === 0) {
        shanten += 1;  // 雀頭なし
      }
      
      shanten = Math.max(shanten, -1);
      
      // 最適解の更新
      if (shanten < minShanten) {
        minShanten = shanten;
        optimalCandidates.length = 0;
        optimalCandidates.push(combination.clone());
      } else if (shanten === minShanten) {
        optimalCandidates.push(combination.clone());
      }
    }
    
    return {
      shanten: minShanten,
      candidates: optimalCandidates
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
    
    const pairs = handTileCount.countPairs();
    const kinds = handTileCount.countTilesWithAtLeast(1);
    
    // 3枚以上ある牌の無駄な枚数を計算
    let tooMany = 0;
    for (let i = 0; i < 34; i++) {
      const count = handTileCount.getCountByIndex(i);
      if (count >= 3) {
        tooMany += count - 2;
      }
    }

    // 七対子は7種類のペアが必要
    // 同じ牌が3枚以上あると効率が悪い
    if (kinds < 7) {
      return 6 - pairs + (7 - kinds);
    }

    return 6 - pairs + tooMany;
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
    let pairs = 0;  // ペア数

    for (const index of terminalIndices) {
      const count = handTileCount.getCountByIndex(index);
      if (count >= 1) {
        kinds++;
        if (count >= 2) {
          pairs++;
        }
      }
    }

    // 13種類揃っている場合
    if (kinds >= 13) {
      return pairs >= 1 ? -1 : 0; // ペアがあれば和了、なければテンパイ
    }

    // 13種類未満の場合
    return 13 - kinds - (pairs > 0 ? 1 : 0);
  }

  /**
   * 数牌スートの面子を抽出（候補リスト付き）
   */
  private extractSuitMentsu(counts: number[], suitIndex: number): SuitMentsuResult {
    // バックトラッキングで最適な面子構成を探索
    const result = { maxMelds: 0 };
    const remainingTileArrays: number[][] = [];
    
    // 再帰的に全ての可能な面子の組み合わせを試す
    this.tryExtractMentsuOnly([...counts], 0, 0, result, remainingTileArrays);
    
    // number[]をTileCountに変換（適切なスート位置に配置）
    const remainingTiles: TileCount[] = remainingTileArrays.map(tiles => {
      const fullArray = new Array(34).fill(0);
      // suitIndex: 0=萬子(0-8), 1=筒子(9-17), 2=索子(18-26)
      const startIndex = suitIndex * 9;
      for (let i = 0; i < 9; i++) {
        fullArray[startIndex + i] = tiles[i] || 0;
      }
      return new TileCount(fullArray);
    });
    
    return { 
      melds: result.maxMelds, 
      remainingTiles 
    };
  }

  /**
   * 各スートの残り牌パターンを組み合わせる
   */
  private generateCombinations(
    suitResults: SuitMentsuResult[], 
    honorRemaining: TileCount
  ): TileCount[] {
    const combinations: TileCount[] = [];
    
    // 各スートの候補数を取得（空の場合はデフォルトパターンを設定）
    const candidates = suitResults.map((r) => {
      if (r.remainingTiles.length > 0) {
        return r.remainingTiles;
      } else {
        // デフォルトパターン：そのスートに牌がない状態
        return [new TileCount()];
      }
    });
    
    // 全ての組み合わせを生成
    for (const manPattern of candidates[0]) {
      for (const pinPattern of candidates[1]) {
        for (const souPattern of candidates[2]) {
          const combined = manPattern.add(pinPattern).add(souPattern).add(honorRemaining);
          combinations.push(combined);
        }
      }
    }
    return combinations;
  }


  /**
   * 残った牌から対子と搭子をカウント
   */
  private countRemainingTiles(tileCount: TileCount): { pairs: number, taatsu: number } {
    let pairs = 0;
    let taatsu = 0;
    
    // 全ての牌（数牌+字牌）の対子をカウント
    for (let i = 0; i < 34; i++) {
      const count = tileCount.getCountByIndex(i);
      if (count >= 2) {
        pairs++;
        tileCount.setCountByIndex(i, count - 2);
      }
    }
    
    // 数牌の搭子をカウント（字牌は搭子にならない）
    for (let suit = 0; suit < 3; suit++) {
      const start = suit * 9;
      
      // 隣接搭子をカウント
      for (let i = start; i < start + 8; i++) {
        const count1 = tileCount.getCountByIndex(i);
        const count2 = tileCount.getCountByIndex(i + 1);
        if (count1 > 0 && count2 > 0) {
          taatsu++;
          tileCount.setCountByIndex(i, count1 - 1);
          tileCount.setCountByIndex(i + 1, count2 - 1);
        }
      }
      
      // 飛び搭子をカウント
      for (let i = start; i < start + 7; i++) {
        const count1 = tileCount.getCountByIndex(i);
        const count3 = tileCount.getCountByIndex(i + 2);
        if (count1 > 0 && count3 > 0) {
          taatsu++;
          tileCount.setCountByIndex(i, count1 - 1);
          tileCount.setCountByIndex(i + 2, count3 - 1);
        }
      }
    }
    
    return { pairs, taatsu };
  }

  /**
   * 面子のみを抽出する再帰処理
   */
  private tryExtractMentsuOnly(
    counts: number[], 
    position: number, 
    currentMelds: number,
    result: { maxMelds: number },
    remainingTiles: number[][]
  ): void {
    // 全ての位置を処理済みの場合
    if (position >= 9) {
      // 現在の面子数と最大面子数を比較
      if (currentMelds > result.maxMelds) {
        result.maxMelds = currentMelds;
        remainingTiles.length = 0;  // 既存の候補をクリア
        remainingTiles.push([...counts]);
      } else if (currentMelds === result.maxMelds) {
        // 同じ面子数の場合、候補に追加
        remainingTiles.push([...counts]);
      }
      return;
    }
    
    // 現在位置に牌がない場合は次へ
    if (counts[position] === 0) {
      this.tryExtractMentsuOnly(counts, position + 1, currentMelds, result, remainingTiles);
      return;
    }
    
    // 刻子を試す
    if (counts[position] >= 3) {
      counts[position] -= 3;
      this.tryExtractMentsuOnly(counts, position, currentMelds + 1, result, remainingTiles);
      counts[position] += 3;
    }
    
    // 順子を試す（position <= 6 の場合のみ）
    if (position <= 6 && counts[position] > 0 && counts[position + 1] > 0 && counts[position + 2] > 0) {
      counts[position]--;
      counts[position + 1]--;
      counts[position + 2]--;
      this.tryExtractMentsuOnly(counts, position, currentMelds + 1, result, remainingTiles);
      counts[position]++;
      counts[position + 1]++;
      counts[position + 2]++;
    }
    
    // 何も取らずに次の位置へ
    this.tryExtractMentsuOnly(counts, position + 1, currentMelds, result, remainingTiles);
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

// 基本シャンテン計算クラス（クリーン版）

import { Hand } from '../common/hand';

/**
 * 基本シャンテン計算クラス
 * Hand基盤APIのみを提供、後方互換性は完全削除
 */
export class BaseShantenCalculator {

  // ===== Hand基盤API（推奨） =====
  
  /**
   * 通常手のシャンテン数を計算（Hand基盤）
   * @param hand 手牌オブジェクト
   */
  public calculateRegularShantenFromHand(hand: Hand): number {
    const tileCount = hand.getTileCountArray();
    const meldCount = hand.getMeldCount();
    return this.calculateRegularShantenFromArray(tileCount, meldCount);
  }

  /**
   * 七対子のシャンテン数を計算（Hand基盤）
   * @param hand 手牌オブジェクト
   */
  public calculateChitoitsuShantenFromHand(hand: Hand): number {
    // 副露がある場合は七対子は成立しない
    if (!hand.canUseSpecialHands()) {
      return Infinity;
    }
    
    const tileCount = hand.getTileCountArray();
    return this.calculateChitoitsuShantenFromArray(tileCount);
  }

  /**
   * 国士無双のシャンテン数を計算（Hand基盤）
   * @param hand 手牌オブジェクト
   */
  public calculateKokushiShantenFromHand(hand: Hand): number {
    // 副露がある場合は国士無双は成立しない
    if (!hand.canUseSpecialHands()) {
      return Infinity;
    }
    
    const tileCount = hand.getTileCountArray();
    return this.calculateKokushiShantenFromArray(tileCount);
  }
  
  // ===== 配列ベース計算エンジン =====

  /**
   * 配列から通常手シャンテン数を計算
   * @param tileCount 34種類の牌数配列
   * @param meldCount 副露面子数（0-4）
   */
  public calculateRegularShantenFromArray(tileCount: number[], meldCount: number = 0): number {
    // 修正: 正しいシャンテン数計算
    // 基本は8シャンテン（4面子1雀頭完成に必要）、副露1つにつき-2シャンテン
    let shanten = 8 - (meldCount * 2);
    
    // 字牌の処理
    let pairs = 0;
    for (let i = 27; i < 34; i++) {
      const count = tileCount[i];
      if (count >= 3) {
        shanten -= 2; // 面子: -2シャンテン
      } else if (count >= 2) {
        pairs++;
        shanten -= 1; // 対子: -1シャンテン
      }
    }
    
    // 数牌の処理（萬子・筒子・索子）
    for (let suit = 0; suit < 3; suit++) {
      const start = suit * 9;
      const suitCounts = tileCount.slice(start, start + 9);
      const suitResult = this.calculateSuitShanten(suitCounts);
      shanten -= suitResult.melds * 2 + suitResult.pairs + suitResult.taatsu;
      pairs += suitResult.pairs;
    }
    
    // 雀頭の調整
    if (pairs === 0) {
      shanten += 1; // 雀頭がない場合は+1シャンテン
    } else if (pairs > 1) {
      shanten += pairs - 1; // 複数対子のペナルティ
    }
    
    return Math.max(shanten, -1);
  }

  /**
   * 配列から七対子のシャンテン数を計算
   * @param tileCount 34種類の牌数配列
   */
  public calculateChitoitsuShantenFromArray(tileCount: number[]): number {
    let pairs = 0;
    let kinds = 0;
    let tooMany = 0;

    for (let i = 0; i < 34; i++) {
      const count = tileCount[i];
      if (count >= 2) pairs++;
      if (count >= 1) kinds++;
      if (count >= 3) tooMany += count - 2;
    }

    // 七対子は7種類のペアが必要
    // 同じ牌が3枚以上あると効率が悪い
    if (kinds < 7) {
      return 6 - pairs + (7 - kinds);
    }

    return 6 - pairs + tooMany;
  }

  /**
   * 配列から国士無双のシャンテン数を計算
   * @param tileCount 34種類の牌数配列
   */
  public calculateKokushiShantenFromArray(tileCount: number[]): number {
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
      const count = tileCount[index];
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

  // ===== 内部ヘルパーメソッド =====

  /**
   * 数牌スート（9枚）のシャンテン寄与を計算
   */
  private calculateSuitShanten(counts: number[]): { melds: number, pairs: number, taatsu: number } {
    // バックトラッキングで最適な面子構成を探索
    let bestResult = { melds: 0, pairs: 0, taatsu: 0 };
        // 再帰的に全ての可能な面子の組み合わせを試す
    this.tryExtractMentsu([...counts], 0, 0, 0, 0, bestResult);
    return bestResult;
  }

  /**
   * 再帰的に面子を抽出する
   */
  private tryExtractMentsu(
    counts: number[], 
    position: number, 
    currentMelds: number,
    currentPairs: number,
    currentTaatsu: number,
    bestResult: { melds: number, pairs: number, taatsu: number }
  ): void {
    // 全ての位置を処理済みの場合
    if (position >= 9) {
      // 残った牌から対子と搭子をカウント
      const remainingResult = this.countRemainingTiles([...counts]);
      const totalMelds = currentMelds;
      const totalPairs = currentPairs + remainingResult.pairs;
      const totalTaatsu = currentTaatsu + remainingResult.taatsu;
      
      // 最適解の更新（面子数優先、次に対子数、最後に搭子数）
      if (this.isBetterResult(totalMelds, totalPairs, totalTaatsu, bestResult)) {
        bestResult.melds = totalMelds;
        bestResult.pairs = totalPairs;
        bestResult.taatsu = totalTaatsu;
      }
      return;
    }
    
    // 現在位置に牌がない場合は次へ
    if (counts[position] === 0) {
      this.tryExtractMentsu(counts, position + 1, currentMelds, currentPairs, currentTaatsu, bestResult);
      return;
    }
    
    // 刻子を試す
    if (counts[position] >= 3) {
      counts[position] -= 3;
      this.tryExtractMentsu(counts, position, currentMelds + 1, currentPairs, currentTaatsu, bestResult);
      counts[position] += 3;
    }
    
    // 順子を試す（position <= 6 の場合のみ）
    if (position <= 6 && counts[position] > 0 && counts[position + 1] > 0 && counts[position + 2] > 0) {
      counts[position]--;
      counts[position + 1]--;
      counts[position + 2]--;
      this.tryExtractMentsu(counts, position, currentMelds + 1, currentPairs, currentTaatsu, bestResult);
      counts[position]++;
      counts[position + 1]++;
      counts[position + 2]++;
    }
    
    // 何も取らずに次の位置へ
    this.tryExtractMentsu(counts, position + 1, currentMelds, currentPairs, currentTaatsu, bestResult);
  }

  /**
   * 残った牌から対子と搭子をカウント
   */
  private countRemainingTiles(counts: number[]): { pairs: number, taatsu: number } {
    let pairs = 0;
    let taatsu = 0;
    
    // 対子をカウント
    for (let i = 0; i < 9; i++) {
      if (counts[i] >= 2) {
        pairs++;
        counts[i] -= 2;
      }
    }
    
    // 隣接搭子をカウント
    for (let i = 0; i < 8; i++) {
      if (counts[i] > 0 && counts[i + 1] > 0) {
        taatsu++;
        counts[i]--;
        counts[i + 1]--;
      }
    }
    
    // 飛び搭子をカウント
    for (let i = 0; i < 7; i++) {
      if (counts[i] > 0 && counts[i + 2] > 0) {
        taatsu++;
        counts[i]--;
        counts[i + 2]--;
      }
    }
    
    return { pairs, taatsu };
  }

  /**
   * より良い結果かどうかを判定
   */
  private isBetterResult(
    melds: number, 
    pairs: number, 
    taatsu: number,
    current: { melds: number, pairs: number, taatsu: number }
  ): boolean {
    // 面子数が多い方が良い
    if (melds > current.melds) return true;
    if (melds < current.melds) return false;
    
    // 面子数が同じなら対子数が多い方が良い
    if (pairs > current.pairs) return true;
    if (pairs < current.pairs) return false;
    
    // 対子数も同じなら搭子数が多い方が良い
    return taatsu > current.taatsu;
  }
}
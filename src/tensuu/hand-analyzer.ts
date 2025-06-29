import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { Component } from '../common/component';
import { HandType } from '../common/types';
import { EffectiveTilesCalculator, type TenpaiEffectiveTilesResult } from './effective-tiles-calculator';
import { ShantenCalculator, type MentsuComposition } from './shanten-calculator';

/**
 * 和了分析結果
 */
export interface WinningAnalysisResult {
  isWinning: boolean;
  handProgress: HandProgressResult;  // 常に手牌進行情報を含む
  winningInfo?: {
    winningTile: Tile;
    compositionsWithWaitTypes: WinningCompositionWithWaitType[];
  };
}

/**
 * 手牌進行状況の分析結果
 */
export interface HandProgressResult {
  // 基本情報
  shanten: number;                                 // シャンテン数（-1=和了, 0=テンパイ, 1以上=向聴）
  handType: HandType;                              // 最適な手牌タイプ
  
  // 有効牌情報
  effectiveTiles: Tile[];                          // 有効牌一覧
  
  // 詳細情報（通常手の場合）
  mentsuCompositions?: MentsuComposition[];         // 面子構成
  
  // テンパイ時の詳細情報
  tenpaiEffectiveTiles?: TenpaiEffectiveTilesResult;
  
  // 便利なフラグ
  isWinning: boolean;    // shanten === -1
  isTenpai: boolean;     // shanten === 0
  isIshanten: boolean;   // shanten === 1
}



/**
 * 和了時の面子構成
 */
export interface WinningComposition {
  handType: HandType;
  components: Component[];
  winningTilePosition: {
    componentIndex: number;
    positionInComponent: number;
  };
}

/**
 * 和了時の面子構成と待ちタイプのセット
 */
export interface WinningCompositionWithWaitType {
  composition: WinningComposition;
  waitType: string; // 文字列形式の待ちタイプ
}

/**
 * 手牌分析クラス
 * EffectiveTilesCalculatorを使用したシンプルな和了判定と待ち分析
 */
export class HandAnalyzer {
  private effectiveTilesCalculator: EffectiveTilesCalculator;
  private shantenCalculator: ShantenCalculator;

  constructor() {
    this.effectiveTilesCalculator = new EffectiveTilesCalculator();
    this.shantenCalculator = new ShantenCalculator();
  }

  /**
   * 和了判定（最も基本的な機能）
   * 自摸抜きでテンパイ＋有効牌に自摸牌が含まれる＝和了
   */
  public isWinning(hand: Hand): boolean {
    // 自摸牌がない場合は和了ではない
    if (!hand.drawnTile) {
      return false;
    }

    const progress = this.analyzeHandProgress(hand);
    
    // テンパイかつ有効牌に自摸牌が含まれる
    return progress.isTenpai && 
           progress.effectiveTiles.some(tile => tile.equals(hand.drawnTile!));
  }

  /**
   * 包括的な和了分析
   */
  public analyzeWinning(hand: Hand): WinningAnalysisResult {
    const progress = this.analyzeHandProgress(hand);
    
    // 和了判定（progressを再利用）
    const isWinning = hand.drawnTile && 
                      progress.isTenpai && 
                      progress.effectiveTiles.some(tile => tile.equals(hand.drawnTile!));
    
    if (!isWinning) {
      return {
        isWinning: false,
        handProgress: progress
      };
    }

    // 和了の場合 - 和了牌に関連する面子構成と待ちタイプのみを抽出
    const winningCompositionsWithWaitTypes = this.extractWinningCompositions(hand.drawnTile!, progress);
    
    return {
      isWinning: true,
      handProgress: progress,
      winningInfo: {
        winningTile: hand.drawnTile!,
        compositionsWithWaitTypes: winningCompositionsWithWaitTypes
      }
    };
  }

  /**
   * 手牌の進行状況を包括的に分析
   * シャンテン数、有効牌情報を提供
   */
  public analyzeHandProgress(hand: Hand): HandProgressResult {
    // 自摸抜きでシャンテン数を計算
    const shantenResult = this.shantenCalculator.calculateShanten(hand, true);
    
    // 有効牌を計算
    const effectiveResult = this.effectiveTilesCalculator.calculateEffectiveTiles(hand);
    
    // テンパイの場合はテンパイ専用のメソッドを呼び出す
    let tenpaiEffectiveTiles: TenpaiEffectiveTilesResult | undefined;
    if (shantenResult.shanten === 0) {
      tenpaiEffectiveTiles = this.effectiveTilesCalculator.calculateTenpaiEffectiveTiles(hand) || undefined;
    }
    
    return {
      shanten: shantenResult.shanten,
      handType: shantenResult.handType,
      effectiveTiles: effectiveResult.tiles,
      mentsuCompositions: shantenResult.optimalStates,
      tenpaiEffectiveTiles,
      
      // 便利なフラグ
      isWinning: shantenResult.shanten === -1,
      isTenpai: shantenResult.shanten === 0,
      isIshanten: shantenResult.shanten === 1
    };
  }

  /**
   * 和了牌に関連する面子構成と待ちタイプを抽出
   */
  private extractWinningCompositions(winningTile: Tile, progress: HandProgressResult): WinningCompositionWithWaitType[] {
    const winningCompositions: WinningCompositionWithWaitType[] = [];
    
    // テンパイでない場合は空配列を返す
    if (!progress.isTenpai || !progress.tenpaiEffectiveTiles) {
      return winningCompositions;
    }

    // 各面子構成について、和了牌に関連するものだけを抽出
    for (const compositionInfo of progress.tenpaiEffectiveTiles.compositionsWithEffectiveTiles) {
      for (const componentInfo of compositionInfo.componentsWithEffectiveTiles) {
        // この待ちコンポーネントが和了牌を含むかチェック
        if (componentInfo.effectiveTiles.some(tile => tile.equals(winningTile))) {
          // 和了時の面子構成を作成（簡略化版）
          const winningComposition: WinningComposition = {
            handType: progress.handType,
            components: compositionInfo.composition.components,
            winningTilePosition: {
              componentIndex: componentInfo.componentIndex,
              positionInComponent: 0 // 実際の位置計算は点数計算時に行う
            }
          };
          
          winningCompositions.push({
            composition: winningComposition,
            waitType: componentInfo.waitType
          });
        }
      }
    }

    return winningCompositions;
  }
}
// 手牌分析クラス - 和了形の面子分解に特化

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { Component, ComponentType } from '../common/component';
import type { ComponentCombination } from '../common/component';
import { ShantenCalculator, type MentsuComposition } from './shanten-calculator';

/**
 * 待ちの種類
 */
export const WaitType = {
  TANKI: 'tanki',     // 単騎待ち（雀頭）
  RYANMEN: 'ryanmen', // 両面待ち
  KANCHAN: 'kanchan', // 嵌張待ち  
  PENCHAN: 'penchan', // 辺張待ち
  SHANPON: 'shanpon'  // 双碰待ち（2つの対子からの刻子待ち）
} as const;
export type WaitType = typeof WaitType[keyof typeof WaitType];

/**
 * あがり牌の詳細情報
 */
export interface WinningTileInfo {
  tile: Tile;                    // あがり牌
  componentIndex: number;        // どの面子/対子であがったか
  positionInComponent: number;   // その面子内での位置（0から始まる）
  waitType: WaitType;           // 待ちの種類
}

/**
 * テンパイ分析結果
 */
export interface TenpaiAnalysis {
  isTenpai: boolean;            // テンパイかどうか
  waitingTiles: Tile[];         // 待ち牌一覧
  waitTypes: WaitType[];        // 待ちの種類（複数の可能性）
  mentsuCompositions: MentsuComposition[]; // 可能な面子構成
}

/**
 * ツモ牌位置情報
 */
export interface TsumoTilePosition {
  compositionIndex: number;     // どの面子構成パターンか
  componentIndex: number;       // その構成内のどのComponent(面子/対子)か
  positionInComponent: number;  // そのComponent内での位置(0-based)
  waitType: WaitType;          // この位置での待ちタイプ
  component: Component;        // 対象のComponent参照
}

/**
 * ツモ牌分析結果
 */
export interface TsumoAnalysisResult {
  tsumoTile: Tile;             // ツモ牌
  positions: TsumoTilePosition[]; // 全ての可能な位置
  waitTypes: WaitType[];       // 統合された待ちタイプ一覧
}

/**
 * 和了分析結果
 */
export interface WinningAnalysis {
  isWinning: boolean;           // 和了かどうか
  winningTileInfos: WinningTileInfo[]; // あがり牌の詳細（複数パターン対応）
  tenpaiAnalysis: TenpaiAnalysis;      // ツモ除外時のテンパイ分析
  tsumoAnalysis?: TsumoAnalysisResult; // ツモ牌位置分析（和了時のみ）
}

/**
 * 手牌の分析に特化したクラス
 * 和了形の面子分解、あがり牌分析、待ち判定等を担当
 */
export class HandAnalyzer {
  private shantenCalculator: ShantenCalculator;

  constructor() {
    this.shantenCalculator = new ShantenCalculator();
  }

  /**
   * 和了形の全ての面子構成を取得
   * @param hand 手牌オブジェクト
   * @returns 可能な全ての和了形ComponentCombination配列
   */
  public getWinningCombinations(hand: Hand): ComponentCombination[] {
    // ShantenCalculatorから最適な状態を取得
    const handTileCount = hand.getTileCount();
    const meldCount = hand.getMeldCount();
    const result = this.shantenCalculator.calculateRegularShanten(handTileCount, meldCount);
    
    // 和了形でない場合は空配列を返す
    if (result.shanten !== -1) {
      return [];
    }

    // optimalStatesからComponentCombinationを作成
    const combinations: ComponentCombination[] = [];
    
    for (const state of result.optimalCompositions) {
      const combination = this.createComponentCombination(state, hand);
      if (combination) {
        combinations.push(combination);
      }
    }
    
    return combinations;
  }

  /**
   * MentsuCompositionからComponentCombinationを作成
   */
  private createComponentCombination(state: MentsuComposition, hand: Hand): ComponentCombination | null {
    try {
      // 門前のComponent（バックトラッキングで見つかった面子・対子）と副露面子を統合
      const allComponents = [...state.components, ...hand.openMelds];
      
      // 4面子1雀頭の検証
      const melds = allComponents.filter(c => c.isCompleteMentsu());
      const pairs = allComponents.filter(c => c.type === ComponentType.PAIR);
      
      if (melds.length !== 4 || pairs.length !== 1) {
        return null; // 正しい和了形でない
      }
      
      return {
        components: allComponents,
        winningTile: hand.drawnTile
      };
    } catch (error) {
      return null; // エラーが発生した場合はnullを返す
    }
  }

  /**
   * 手牌が和了形かどうかを判定
   */
  public isWinningHand(hand: Hand): boolean {
    return this.getWinningCombinations(hand).length > 0;
  }

  /**
   * 最も有利な和了パターンを取得
   * TODO: 将来的に役や点数を考慮した最適パターン選択を実装
   */
  public getBestWinningCombination(hand: Hand): ComponentCombination | null {
    const combinations = this.getWinningCombinations(hand);
    return combinations.length > 0 ? combinations[0] : null;
  }

  /**
   * 包括的な和了分析
   * 1. 全牌での和了確認
   * 2. ツモ除外でのテンパイ分析
   * 3. ツモ牌位置分析
   * 4. あがり牌情報の特定
   */
  public analyzeWinning(hand: Hand): WinningAnalysis {
    // 1. 全牌での和了確認
    const isWinning = this.shantenCalculator.isWinningHand(hand, false);
    
    if (!isWinning) {
      return {
        isWinning: false,
        winningTileInfos: [],
        tenpaiAnalysis: this.analyzeTenpai(hand)
      };
    }

    // 2. ツモ除外でのテンパイ分析
    const tenpaiAnalysis = this.analyzeTenpai(hand);
    
    // 3. ツモ牌位置分析
    const tsumoAnalysis = this.analyzeTsumoTilePositions(hand);
    
    // 4. あがり牌情報の特定
    const winningTileInfos = this.determineWinningTileInfos(hand, tenpaiAnalysis);

    return {
      isWinning: true,
      winningTileInfos,
      tenpaiAnalysis,
      tsumoAnalysis
    };
  }

  /**
   * ツモ牌位置分析
   * 14枚の和了形からツモ牌がどの面子のどの位置にあるかを特定
   */
  public analyzeTsumoTilePositions(hand: Hand): TsumoAnalysisResult {
    const tsumoTile = hand.drawnTile;
    const positions: TsumoTilePosition[] = [];
    
    // 14枚での和了形面子構成を取得
    const winningResult = this.shantenCalculator.calculateShanten(hand, false);
    
    if (winningResult.shanten !== -1 || !winningResult.optimalStates) {
      return {
        tsumoTile,
        positions: [],
        waitTypes: []
      };
    }

    // 各面子構成パターンでツモ牌を検索
    for (let compIndex = 0; compIndex < winningResult.optimalStates.length; compIndex++) {
      const composition = winningResult.optimalStates[compIndex];
      
      // 面子構成内の各Componentでツモ牌を検索
      for (let componentIndex = 0; componentIndex < composition.components.length; componentIndex++) {
        const component = composition.components[componentIndex];
        const positionsInComponent = this.findTsumoTileInComponent(component, tsumoTile);
        
        // 見つかった各位置について待ちタイプを判定
        for (const positionInComponent of positionsInComponent) {
          const waitType = this.determineWaitTypeFromPosition(component, positionInComponent);
          
          positions.push({
            compositionIndex: compIndex,
            componentIndex,
            positionInComponent,
            waitType,
            component
          });
        }
      }
    }

    // 待ちタイプを統合
    const waitTypes = this.consolidateWaitTypes(positions);

    return {
      tsumoTile,
      positions,
      waitTypes
    };
  }

  /**
   * Component内でツモ牌を検索
   */
  private findTsumoTileInComponent(component: Component, tsumoTile: Tile): number[] {
    const positions: number[] = [];
    
    for (let i = 0; i < component.tiles.length; i++) {
      if (component.tiles[i].equals(tsumoTile)) {
        positions.push(i);
      }
    }
    
    return positions;
  }

  /**
   * ツモ除外でのテンパイ分析
   */
  public analyzeTenpai(hand: Hand): TenpaiAnalysis {
    // ツモ牌を除外してシャンテン計算
    const shantenResult = this.shantenCalculator.calculateShanten(hand, true);
    const isTenpai = shantenResult.shanten === 0;
    
    if (!isTenpai) {
      return {
        isTenpai: false,
        waitingTiles: [],
        waitTypes: [],
        mentsuCompositions: []
      };
    }

    // テンパイの場合、有効牌は別途EffectiveTilesCalculatorで計算
    const waitingTiles: Tile[] = []; // TODO: 必要に応じてEffectiveTilesCalculatorを使用
    
    // 面子構成情報を取得（通常手の場合）
    const mentsuCompositions = shantenResult.handType === 'regular' && shantenResult.optimalStates 
      ? shantenResult.optimalStates 
      : [];

    // 待ちタイプを判定
    const waitTypes = this.determineWaitTypes(hand, waitingTiles, mentsuCompositions);

    return {
      isTenpai: true,
      waitingTiles,
      waitTypes,
      mentsuCompositions
    };
  }

  /**
   * あがり牌情報の特定
   */
  private determineWinningTileInfos(hand: Hand, tenpaiAnalysis: TenpaiAnalysis): WinningTileInfo[] {
    if (!tenpaiAnalysis.isTenpai) {
      return [];
    }

    const winningTileInfos: WinningTileInfo[] = [];
    const drawnTile = hand.drawnTile;

    // 待ち牌にツモ牌が含まれているか確認
    const isValidWinningTile = tenpaiAnalysis.waitingTiles.some(tile => tile.equals(drawnTile));
    
    if (!isValidWinningTile) {
      return [];
    }

    // 各面子構成でのあがり牌位置を特定
    for (let compIndex = 0; compIndex < tenpaiAnalysis.mentsuCompositions.length; compIndex++) {
      const composition = tenpaiAnalysis.mentsuCompositions[compIndex];
      const winningInfo = this.findWinningTileInComposition(drawnTile, composition, tenpaiAnalysis.waitTypes);
      
      if (winningInfo) {
        winningTileInfos.push({
          tile: drawnTile,
          componentIndex: winningInfo.componentIndex,
          positionInComponent: winningInfo.position,
          waitType: winningInfo.waitType
        });
      }
    }

    return winningTileInfos;
  }

  /**
   * 面子構成内でのあがり牌位置を特定
   */
  private findWinningTileInComposition(_winningTile: Tile, _composition: MentsuComposition, _waitTypes: WaitType[]): { componentIndex: number, position: number, waitType: WaitType } | null {
    // TODO: 実装が必要
    // 各Componentでツモ牌がどの位置に入るかを特定
    // 現在はプレースホルダー
    return null;
  }

  /**
   * 位置から待ちタイプを判定
   */
  private determineWaitTypeFromPosition(component: Component, position: number): WaitType {
    switch (component.type) {
      case ComponentType.PAIR:
        return WaitType.TANKI; // 対子なら単騎待ち
        
      case ComponentType.TRIPLET:
        return WaitType.SHANPON; // 刻子なら双碰待ち(対子からの刻子完成)
        
      case ComponentType.SEQUENCE:
        // 順子の場合、位置によって判定
        const tiles = component.tiles;
        if (tiles.length !== 3) return WaitType.TANKI; // 異常ケース
        
        // 端牌かどうかをチェック
        const firstValue = tiles[0].value;
        const isTerminal = (firstValue === 1 || firstValue === 7); // 123 or 789
        
        if (position === 0) {
          // 最初の位置
          return isTerminal && firstValue === 1 ? WaitType.PENCHAN : WaitType.RYANMEN;
        } else if (position === 2) {
          // 最後の位置  
          return isTerminal && firstValue === 7 ? WaitType.PENCHAN : WaitType.RYANMEN;
        } else {
          // 真ん中の位置
          return WaitType.KANCHAN;
        }
        
      default:
        return WaitType.TANKI;
    }
  }

  /**
   * 待ちタイプを統合
   */
  private consolidateWaitTypes(positions: TsumoTilePosition[]): WaitType[] {
    const waitTypeSet = new Set<WaitType>();
    
    for (const position of positions) {
      waitTypeSet.add(position.waitType);
    }
    
    return Array.from(waitTypeSet);
  }

  /**
   * 待ちタイプを判定（旧メソッド、互換性のため保持）
   */
  private determineWaitTypes(hand: Hand, _waitingTiles: Tile[], _mentsuCompositions: MentsuComposition[]): WaitType[] {
    // 新しいツモ牌分析を使用
    const tsumoAnalysis = this.analyzeTsumoTilePositions(hand);
    return tsumoAnalysis.waitTypes;
  }
}
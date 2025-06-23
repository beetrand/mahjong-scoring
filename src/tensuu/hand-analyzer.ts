// 手牌分析クラス - 和了形の面子分解に特化

import { Hand } from '../common/hand';
import { ComponentType } from '../common/component';
import type { ComponentCombination } from '../common/component';
import { ShantenCalculator, type MentsuComposition } from './shanten-calculator';

/**
 * 手牌の分析に特化したクラス
 * 和了形の面子分解、パターン解析等を担当
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
    const result = this.shantenCalculator.calculateRegularShanten(hand);
    
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
}
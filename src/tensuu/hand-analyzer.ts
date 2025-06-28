// 手牌分析クラス - EffectiveTilesCalculatorを活用したシンプルな実装

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { Component, ComponentType } from '../common/component';
import { HandType, WaitType } from '../common/types';
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
 * @deprecated Use HandProgressResult instead
 */
export interface TenpaiAnalysisResult {
  isTenpai: boolean;
  shanten: number;
  waitingTiles: Tile[];
  waitingTilesByHandType: Map<HandType, Tile[]>;
  mentsuCompositions?: MentsuComposition[]; // 通常手の場合
}

/**
 * 待ちタイプ分析結果
 */
export interface WaitTypeAnalysisResult {
  waitingTiles: WaitingTileInfo[];
  hasMultipleWaitTypes: boolean;
}

/**
 * 待ち牌情報
 */
export interface WaitingTileInfo {
  tile: Tile;
  waitTypes: WaitType[];
  handTypes: HandType[];
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
  waitType: WaitType;
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
    const progress = this.
    analyzeHandProgress(hand);
    
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

    // 和了の場合
    const compositionsWithWaitTypes = this.analyzeWinningCompositionsWithWaitTypes(hand.drawnTile!, progress);

    return {
      isWinning: true,
      handProgress: progress,
      winningInfo: {
        winningTile: hand.drawnTile!,
        compositionsWithWaitTypes
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
   * 待ちの種類分析
   */
  public analyzeWaitTypes(hand: Hand): WaitTypeAnalysisResult {
    const progress = this.analyzeHandProgress(hand);
    
    if (!progress.isTenpai) {
      return {
        waitingTiles: [],
        hasMultipleWaitTypes: false
      };
    }

    const waitingTileInfos: WaitingTileInfo[] = [];
    const allWaitTypes = new Set<WaitType>();

    // 各待ち牌について待ちの種類を判定
    for (const tile of progress.effectiveTiles) {
      const waitTypes = this.determineWaitTypesForTile(tile, progress.handType, progress);
      waitingTileInfos.push({
        tile,
        waitTypes,
        handTypes: [progress.handType]
      });
      waitTypes.forEach(wt => allWaitTypes.add(wt));
    }

    return {
      waitingTiles: waitingTileInfos,
      hasMultipleWaitTypes: allWaitTypes.size > 1
    };
  }

  /**
   * 和了時の面子構成と待ちタイプを同時に分析
   */
   private analyzeWinningCompositionsWithWaitTypes(winningTile: Tile, progress: HandProgressResult): WinningCompositionWithWaitType[] {
    // 特殊形の場合
    if (progress.handType === HandType.CHITOITSU || progress.handType === HandType.KOKUSHI) {
      return this.analyzeSpecialHandWinning();
    }

    // 通常手の場合
    const results: WinningCompositionWithWaitType[] = [];
    
    if (!progress.mentsuCompositions) {
      return results;
    }

    // テンパイ状態の各面子構成で自摸牌が入る塔子を特定
    for (const tenpaiComposition of progress.mentsuCompositions) {
      // 自摸牌が入る塔子を見つける
      for (let i = 0; i < tenpaiComposition.components.length; i++) {
        const component = tenpaiComposition.components[i];
        
        if (component.type === ComponentType.TAATSU) {
          const waitType = this.determineWaitTypeFromTaatsu(component, winningTile);
          
          if (waitType) {
            // 塔子を完成面子に変換
            const completedComponent = this.convertTaatsuToCompletedMentsu(component, winningTile);
            
            if (completedComponent) {
              // 完成した面子構成を作成
              const completedComponents = [...tenpaiComposition.components];
              completedComponents[i] = completedComponent;
              
              const winningComposition: WinningComposition = {
                handType: progress.handType,
                components: completedComponents,
                winningTilePosition: this.findWinningTilePositionInComposition(completedComponents, winningTile, i)!
              };
              
              results.push({
                composition: winningComposition,
                waitType
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * 特殊形（七対子・国士無双）の和了分析
   */
  private analyzeSpecialHandWinning(): WinningCompositionWithWaitType[] {
    // 七対子・国士無双は常にタンキ待ち
    // 実装の詳細は後で追加
    return [];
  }

  /**
   * 塔子を完成面子に変換
   */
  private convertTaatsuToCompletedMentsu(taatsu: Component, winningTile: Tile): Component | null {
    if (taatsu.tiles.length !== 2) {
      return null;
    }

    const newTiles = [...taatsu.tiles, winningTile].sort(Tile.compare);
    
    // 順子になるかチェック
    if (this.isSequence(newTiles)) {
      return new Component(newTiles, ComponentType.SEQUENCE, taatsu.isConcealed, taatsu.meldInfo);
    }
    
    return null;
  }

  /**
   * 3枚の牌が順子かどうかチェック
   */
  private isSequence(tiles: Tile[]): boolean {
    if (tiles.length !== 3) return false;
    
    const suit = tiles[0].suit;
    if (!tiles.every(t => t.suit === suit)) return false;
    
    const values = tiles.map(t => t.value).sort((a, b) => a - b);
    return values[1] - values[0] === 1 && values[2] - values[1] === 1;
  }

  /**
   * 面子構成全体での和了牌の位置を特定
   */
  private findWinningTilePositionInComposition(components: Component[], winningTile: Tile, targetComponentIndex: number): { componentIndex: number, positionInComponent: number } | null {
    const component = components[targetComponentIndex];
    for (let i = 0; i < component.tiles.length; i++) {
      if (component.tiles[i].equals(winningTile)) {
        return { componentIndex: targetComponentIndex, positionInComponent: i };
      }
    }
    return null;
  }

  /**
   * 特定の牌に対する待ちタイプを判定
   */
  private determineWaitTypesForTile(waitingTile: Tile, handType: HandType, progress: HandProgressResult): WaitType[] {
    // 特殊形の場合
    if (handType === HandType.CHITOITSU) {
      return [WaitType.TANKI]; // 七対子は単騎待ち
    }
    if (handType === HandType.KOKUSHI) {
      return [WaitType.TANKI]; // 国士無双も単騎待ち
    }

    // 通常手の場合、テンパイ状態の面子構成から判定
    const waitTypes = new Set<WaitType>();
    
    // テンパイ時の詳細情報を使用
    if (progress.tenpaiEffectiveTiles) {
      for (const compositionInfo of progress.tenpaiEffectiveTiles.compositionsWithEffectiveTiles) {
        // コンポーネントベースのアプローチ
        for (const compInfo of compositionInfo.componentsWithEffectiveTiles) {
          if (compInfo.effectiveTiles.some(tile => tile.equals(waitingTile))) {
            // 待ちタイプを直接取得
            if (compInfo.waitType) {
              this.addWaitTypeFromString(compInfo.waitType, waitTypes);
            }
          }
        }
      }
    } else if (progress.mentsuCompositions) {
      // フォールバック: 従来の方法
      for (const composition of progress.mentsuCompositions) {
        for (const component of composition.components) {
          if (component.type === ComponentType.TAATSU) {
            const waitType = this.determineWaitTypeFromTaatsu(component, waitingTile);
            if (waitType) {
              waitTypes.add(waitType);
            }
          }
        }
      }
    }

    // 何も見つからない場合はタンキ待ち
    return waitTypes.size > 0 ? Array.from(waitTypes) : [WaitType.TANKI];
  }

  /**
   * 文字列の待ちタイプをWaitTypeに変換して追加
   */
  private addWaitTypeFromString(waitTypeStr: string, waitTypes: Set<WaitType>): void {
    switch (waitTypeStr) {
      case 'ryanmen':
        waitTypes.add(WaitType.RYANMEN);
        break;
      case 'kanchan':
        waitTypes.add(WaitType.KANCHAN);
        break;
      case 'penchan':
        waitTypes.add(WaitType.PENCHAN);
        break;
      case 'tanki':
        waitTypes.add(WaitType.TANKI);
        break;
      case 'shanpon':
        waitTypes.add(WaitType.SHANPON);
        break;
    }
  }

  /**
   * 塔子から待ちタイプを判定
   */
  private determineWaitTypeFromTaatsu(taatsu: Component, waitingTile: Tile): WaitType | null {
    if (taatsu.tiles.length !== 2) {
      return null;
    }

    const [tile1, tile2] = taatsu.tiles;
    
    // 同じスートでない場合は判定不可
    if (tile1.suit !== tile2.suit || tile1.suit !== waitingTile.suit) {
      return null;
    }

    const values = [tile1.value, tile2.value].sort((a, b) => a - b);
    const waitValue = waitingTile.value;

    // 連続する2牌の塔子の場合
    if (values[1] - values[0] === 1) {
      // 両面塔子の可能性
      if (waitValue === values[0] - 1) {
        // 下側に入る場合
        // 完成順子が 123 なら waitValue=1 でペンチャン、それ以外はリャンメン
        return waitValue === 1 ? WaitType.PENCHAN : WaitType.RYANMEN;
      } else if (waitValue === values[1] + 1) {
        // 上側に入る場合
        // 完成順子が 789 なら waitValue=9 でペンチャン、 123 なら waitValue=3 でペンチャン
        const completedSequence = [values[0], values[1], waitValue].sort((a, b) => a - b);
        return (completedSequence[0] === 1 || completedSequence[2] === 9) ? WaitType.PENCHAN : WaitType.RYANMEN;
      }
    }
    
    // 1つ飛びの塔子の場合（嵌張）
    if (values[1] - values[0] === 2) {
      if (waitValue === values[0] + 1) {
        return WaitType.KANCHAN;
      }
    }

    return null;
  }

}
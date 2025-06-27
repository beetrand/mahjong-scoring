// 手牌分析クラス - EffectiveTilesCalculatorを活用したシンプルな実装

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { Component, ComponentType } from '../common/component';
import { HandType, WaitType } from '../common/types';
import { EffectiveTilesCalculator, type EffectiveTileDetails } from './effective-tiles-calculator';
import { ShantenCalculator, type MentsuComposition } from './shanten-calculator';

/**
 * 和了分析結果
 */
export interface WinningAnalysisResult {
  isWinning: boolean;
  handProgress: HandProgressResult;  // 常に手牌進行情報を含む
  winningInfo?: {
    winningTile: Tile;
    waitTypes: WaitType[];
    compositions: WinningComposition[];
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
  effectiveTilesByHandType: Map<HandType, Tile[]>; // 手牌タイプ別の有効牌
  
  // 詳細情報
  effectiveTileDetails: EffectiveTileDetails[];    // 各有効牌の詳細
  mentsuCompositions?: MentsuComposition[];         // 面子構成（通常手の場合）
  
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
    const isWinning = this.isWinning(hand);
    
    if (!isWinning) {
      return {
        isWinning: false,
        handProgress: progress
      };
    }

    // 和了の場合
    const waitTypes = this.analyzeWaitTypesForWinningTile(hand, hand.drawnTile!);
    const compositions = this.analyzeWinningComposition(hand);

    return {
      isWinning: true,
      handProgress: progress,
      winningInfo: {
        winningTile: hand.drawnTile!,
        waitTypes,
        compositions
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
    
    // 有効牌を計算（シャンテン数に関わらず）
    const effectiveResult = this.effectiveTilesCalculator.calculateEffectiveTiles(hand);
    
    // 手牌タイプ別に有効牌を整理
    const effectiveTilesByHandType = new Map<HandType, Tile[]>();
    for (const detail of effectiveResult.details) {
      if (!effectiveTilesByHandType.has(detail.handType)) {
        effectiveTilesByHandType.set(detail.handType, []);
      }
      effectiveTilesByHandType.get(detail.handType)!.push(detail.tile);
    }
    
    return {
      shanten: shantenResult.shanten,
      handType: shantenResult.handType,
      effectiveTiles: effectiveResult.tiles,
      effectiveTilesByHandType,
      effectiveTileDetails: effectiveResult.details,
      mentsuCompositions: shantenResult.optimalStates,
      
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
    for (const [handType, tiles] of progress.effectiveTilesByHandType) {
      for (const tile of tiles) {
        const waitTypes = this.determineWaitTypesForTile(hand, tile, handType);
        waitingTileInfos.push({
          tile,
          waitTypes,
          handTypes: [handType]
        });
        waitTypes.forEach(wt => allWaitTypes.add(wt));
      }
    }

    return {
      waitingTiles: waitingTileInfos,
      hasMultipleWaitTypes: allWaitTypes.size > 1
    };
  }

  /**
   * 和了時の面子構成分析
   */
  private analyzeWinningComposition(hand: Hand): WinningComposition[] {
    if (!hand.drawnTile) {
      return [];
    }

    const compositions: WinningComposition[] = [];
    
    // 14枚での和了形を取得
    const shantenResult = this.shantenCalculator.calculateShanten(hand, false);
    
    if (shantenResult.shanten !== -1 || !shantenResult.optimalStates) {
      return compositions;
    }

    // 各面子構成パターンで自摸牌の位置を特定
    for (const mentsuComposition of shantenResult.optimalStates) {
      const position = this.findTileInComposition(hand.drawnTile, mentsuComposition);
      if (position) {
        compositions.push({
          handType: shantenResult.handType,
          components: mentsuComposition.components,
          winningTilePosition: position
        });
      }
    }

    return compositions;
  }

  /**
   * 特定の牌に対する待ちタイプを判定
   */
  private determineWaitTypesForTile(hand: Hand, waitingTile: Tile, handType: HandType): WaitType[] {
    // 特殊形の場合
    if (handType === HandType.CHITOITSU) {
      return [WaitType.TANKI]; // 七対子は単騎待ち
    }
    if (handType === HandType.KOKUSHI) {
      return [WaitType.TANKI]; // 国士無双も単騎待ち
    }

    // 通常手の場合、仮想的に牌を追加してどの面子が完成するか確認
    const waitTypes = new Set<WaitType>();
    
    // 仮想手牌を作成（自摸牌なしで待ち牌を追加）
    const virtualTiles = [...hand.getConcealedTiles()];
    if (hand.drawnTile) {
      // 自摸牌を一度だけ除去
      const index = virtualTiles.findIndex(t => t.equals(hand.drawnTile!));
      if (index >= 0) {
        virtualTiles.splice(index, 1);
      }
    }
    virtualTiles.push(waitingTile);

    const virtualHand = Hand.create(virtualTiles, hand.openMelds, {
      drawnTile: waitingTile.toString(),
      isTsumo: true,
      gameContext: hand.gameContext
    });

    // 和了形の面子構成を取得
    const shantenResult = this.shantenCalculator.calculateShanten(virtualHand, false);
    if (shantenResult.shanten === -1 && shantenResult.optimalStates) {
      // 各面子構成で待ちタイプを判定
      for (const composition of shantenResult.optimalStates) {
        const position = this.findTileInComposition(waitingTile, composition);
        if (position) {
          const component = composition.components[position.componentIndex];
          const waitType = this.determineWaitTypeFromComponent(component, position.positionInComponent, waitingTile);
          waitTypes.add(waitType);
        }
      }
    }

    return Array.from(waitTypes);
  }

  /**
   * 和了牌に対する待ちタイプを判定
   */
  private analyzeWaitTypesForWinningTile(hand: Hand, winningTile: Tile): WaitType[] {
    const shantenResult = this.shantenCalculator.calculateShanten(hand, true);
    
    if (shantenResult.handType === HandType.CHITOITSU) {
      return [WaitType.TANKI];
    }
    if (shantenResult.handType === HandType.KOKUSHI) {
      return [WaitType.TANKI];
    }

    // 通常手の場合
    const waitTypes = new Set<WaitType>();
    const compositions = this.analyzeWinningComposition(hand);
    
    for (const composition of compositions) {
      const component = composition.components[composition.winningTilePosition.componentIndex];
      const waitType = this.determineWaitTypeFromComponent(
        component,
        composition.winningTilePosition.positionInComponent,
        winningTile
      );
      waitTypes.add(waitType);
    }

    return Array.from(waitTypes);
  }

  /**
   * 面子構成内で牌を検索
   */
  private findTileInComposition(tile: Tile, composition: MentsuComposition): { componentIndex: number, positionInComponent: number } | null {
    for (let i = 0; i < composition.components.length; i++) {
      const component = composition.components[i];
      for (let j = 0; j < component.tiles.length; j++) {
        if (component.tiles[j].equals(tile)) {
          return { componentIndex: i, positionInComponent: j };
        }
      }
    }
    return null;
  }

  /**
   * コンポーネントと位置から待ちタイプを判定
   */
  private determineWaitTypeFromComponent(component: Component, position: number, _tile: Tile): WaitType {
    switch (component.type) {
      case ComponentType.PAIR:
        return WaitType.TANKI; // 対子完成は単騎待ち
        
      case ComponentType.TRIPLET:
        return WaitType.SHANPON; // 刻子完成は双碰待ち
        
      case ComponentType.SEQUENCE:
        // 順子の場合、位置によって判定
        if (component.tiles.length !== 3) return WaitType.TANKI;
        
        const firstValue = component.tiles[0].value;
        const isTerminal = firstValue === 1 || firstValue === 7;
        
        if (position === 0) {
          return isTerminal && firstValue === 1 ? WaitType.PENCHAN : WaitType.RYANMEN;
        } else if (position === 2) {
          return isTerminal && firstValue === 7 ? WaitType.PENCHAN : WaitType.RYANMEN;
        } else {
          return WaitType.KANCHAN; // 真ん中は嵌張
        }
        
      default:
        return WaitType.TANKI;
    }
  }

}
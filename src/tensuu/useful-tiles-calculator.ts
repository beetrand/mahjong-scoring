// 有効牌計算クラス

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { HandType, TileSuit } from '../common/types';
import { BaseShantenCalculator } from './base-shanten-calculator';

/**
 * 有効牌計算クラス
 * 現在の手牌から有効牌（シャンテン数を減らす牌）の計算を担当
 */
export class UsefulTilesCalculator {
  private baseShantenCalculator: BaseShantenCalculator;

  constructor() {
    this.baseShantenCalculator = new BaseShantenCalculator();
  }

  /**
   * 指定された手牌タイプで有効牌を計算
   */
  public calculateUsefulTiles(tiles: Tile[], handType?: HandType): Tile[] {
    if (tiles.length !== 13 && tiles.length !== 14) {
      return [];
    }

    const usefulTiles: Tile[] = [];
    const allPossibleTiles = this.generateAllPossibleTiles();
    
    // 現在のシャンテン数を取得
    const currentShanten = this.getCurrentShanten(tiles, handType);
    
    // 各牌を試して、シャンテン数が改善するかチェック
    for (const testTile of allPossibleTiles) {
      // 手牌が14枚の場合は1枚捨てる必要があるが、
      // 簡易実装として13枚に1枚加える場合のみ考慮
      if (tiles.length === 13) {
        const newTiles = [...tiles, testTile];
        const newShanten = this.getCurrentShanten(newTiles, handType);
        
        if (newShanten < currentShanten) {
          usefulTiles.push(testTile);
        }
      }
    }

    return this.removeDuplicates(usefulTiles);
  }

  /**
   * 全ての手牌タイプで有効牌を計算
   */
  public calculateUsefulTilesForAllTypes(tiles: Tile[]): Map<HandType, Tile[]> {
    const result = new Map<HandType, Tile[]>();
    
    result.set(HandType.REGULAR, this.calculateUsefulTiles(tiles, HandType.REGULAR));
    result.set(HandType.CHITOITSU, this.calculateUsefulTiles(tiles, HandType.CHITOITSU));
    result.set(HandType.KOKUSHI, this.calculateUsefulTiles(tiles, HandType.KOKUSHI));
    
    return result;
  }

  /**
   * 最適な手牌タイプの有効牌を計算
   */
  public calculateBestUsefulTiles(tiles: Tile[]): Tile[] {
    // 仮のHandオブジェクトを作成
    const mockHand = this.createMockHand(tiles);
    
    const regularShanten = this.baseShantenCalculator.calculateRegularShantenFromHand(mockHand);
    const chitoitsuShanten = this.baseShantenCalculator.calculateChitoitsuShantenFromHand(mockHand);
    const kokushiShanten = this.baseShantenCalculator.calculateKokushiShantenFromHand(mockHand);
    
    const minShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
    
    let bestHandType: HandType;
    if (regularShanten === minShanten) {
      bestHandType = HandType.REGULAR;
    } else if (chitoitsuShanten === minShanten) {
      bestHandType = HandType.CHITOITSU;
    } else {
      bestHandType = HandType.KOKUSHI;
    }
    
    return this.calculateUsefulTiles(tiles, bestHandType);
  }

  /**
   * 現在のシャンテン数を取得
   */
  private getCurrentShanten(tiles: Tile[], handType?: HandType): number {
    // 仮のHandオブジェクトを作成
    const mockHand = this.createMockHand(tiles);
    
    if (!handType) {
      // 最小シャンテン数を返す
      const regularShanten = this.baseShantenCalculator.calculateRegularShantenFromHand(mockHand);
      const chitoitsuShanten = this.baseShantenCalculator.calculateChitoitsuShantenFromHand(mockHand);
      const kokushiShanten = this.baseShantenCalculator.calculateKokushiShantenFromHand(mockHand);
      return Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
    }

    switch (handType) {
      case HandType.REGULAR:
        return this.baseShantenCalculator.calculateRegularShantenFromHand(mockHand);
      case HandType.CHITOITSU:
        return this.baseShantenCalculator.calculateChitoitsuShantenFromHand(mockHand);
      case HandType.KOKUSHI:
        return this.baseShantenCalculator.calculateKokushiShantenFromHand(mockHand);
      default:
        return Infinity;
    }
  }

  /**
   * テスト用の仮のHandオブジェクト作成
   */
  private createMockHand(tiles: Tile[]): Hand {
    // 簡易的なモックHandを作成
    const mockGameContext = {
      roundWind: 1 as any,
      playerWind: 1 as any,
      doraIndicators: [],
      uraDoraIndicators: [],
      hasRedDora: false
    };
    
    return new Hand(tiles, {
      drawnTile: tiles[tiles.length - 1].toString(),
      isTsumo: true,
      gameContext: mockGameContext,
      openMelds: []
    });
  }

  /**
   * 全ての可能な牌を生成
   */
  private generateAllPossibleTiles(): Tile[] {
    const tiles: Tile[] = [];
    
    // 数牌 (1-9)
    for (const suit of [TileSuit.MAN, TileSuit.PIN, TileSuit.SOU]) {
      for (let value = 1; value <= 9; value++) {
        tiles.push(new Tile(suit, value));
      }
    }
    
    // 風牌 (1-4)
    for (let value = 1; value <= 4; value++) {
      tiles.push(new Tile(TileSuit.WIND, value));
    }
    
    // 三元牌 (1-3)
    for (let value = 1; value <= 3; value++) {
      tiles.push(new Tile(TileSuit.DRAGON, value));
    }
    
    return tiles;
  }

  /**
   * 重複する牌を除去
   */
  private removeDuplicates(tiles: Tile[]): Tile[] {
    const seen = new Set<string>();
    return tiles.filter(tile => {
      const key = tile.toString();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 有効牌の詳細情報を計算
   */
  public calculateUsefulTilesWithDetails(tiles: Tile[], handType?: HandType): {
    tiles: Tile[];
    improvements: Map<string, number>; // 牌 -> シャンテン改善数
  } {
    if (tiles.length !== 13 && tiles.length !== 14) {
      return { tiles: [], improvements: new Map() };
    }

    const usefulTiles: Tile[] = [];
    const improvements = new Map<string, number>();
    const allPossibleTiles = this.generateAllPossibleTiles();
    
    // 現在のシャンテン数を取得
    const currentShanten = this.getCurrentShanten(tiles, handType);
    
    // 各牌を試して、シャンテン数の改善を計算
    for (const testTile of allPossibleTiles) {
      if (tiles.length === 13) {
        const newTiles = [...tiles, testTile];
        const newShanten = this.getCurrentShanten(newTiles, handType);
        const improvement = currentShanten - newShanten;
        
        if (improvement > 0) {
          usefulTiles.push(testTile);
          improvements.set(testTile.toString(), improvement);
        }
      }
    }

    return { 
      tiles: this.removeDuplicates(usefulTiles), 
      improvements 
    };
  }
}
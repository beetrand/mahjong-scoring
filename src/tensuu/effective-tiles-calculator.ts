// 有効牌計算クラス

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { HandType } from '../common/types';
import { ShantenCalculator } from './shanten-calculator';
import { TILE_NAMES } from '../common/tile-constants';

/**
 * 有効牌詳細情報
 */
export interface EffectiveTileDetails {
  tile: Tile;
  handType: HandType;   // この牌が有効な手牌タイプ
}

/**
 * 有効牌計算結果
 */
export interface EffectiveTilesResult {
  tiles: Tile[];                           // 有効牌一覧
  details: EffectiveTileDetails[];         // 詳細情報
  currentShanten: number;                  // 現在のシャンテン数
}

/**
 * 有効牌計算クラス
 * 現在の手牌から有効牌（シャンテン数を減らす牌）の計算を担当
 */
export class EffectiveTilesCalculator {
  private shantenCalculator: ShantenCalculator;

  constructor() {
    this.shantenCalculator = new ShantenCalculator();
  }

  /**
   * 有効牌を計算（メインメソッド）
   */
  public calculateEffectiveTiles(hand: Hand): EffectiveTilesResult {

    const details: EffectiveTileDetails[] = [];
    
    // 現在のシャンテン数を各手牌タイプで計算（ツモ牌除外）
    const handTileCount = hand.getTileCount(true);
    const meldCount = hand.getMeldCount();
    const hasMelds = hand.hasMelds();
    
    const regularShanten = this.shantenCalculator.calculateRegularShanten(handTileCount, meldCount).shanten;
    const chitoitsuShanten = this.shantenCalculator.calculateChitoitsuShanten(handTileCount, hasMelds);
    const kokushiShanten = this.shantenCalculator.calculateKokushiShanten(handTileCount, hasMelds);
    
    // 最小シャンテン数を特定
    const minShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
    
    // 最小シャンテン数と同じ値の手牌タイプを収集（複数最適解対応）
    const optimalHandTypes: { type: HandType, currentShanten: number }[] = [];
    if (regularShanten === minShanten) {
      optimalHandTypes.push({ type: HandType.REGULAR, currentShanten: regularShanten });
    }
    if (chitoitsuShanten === minShanten) {
      optimalHandTypes.push({ type: HandType.CHITOITSU, currentShanten: chitoitsuShanten });
    }
    if (kokushiShanten === minShanten) {
      optimalHandTypes.push({ type: HandType.KOKUSHI, currentShanten: kokushiShanten });
    }
    
    // 全牌をテスト
    const allTiles = TILE_NAMES.map(tileName => new Tile(tileName));
    
    for (const testTile of allTiles) {
      // 牌を1枚追加してテスト用手牌を作成
      const testTileCount = handTileCount.clone();
      testTileCount.addTile(testTile);
      
      // 最適手牌タイプでのみシャンテン数を計算
      for (const optimal of optimalHandTypes) {
        let newShanten: number;
        
        switch (optimal.type) {
          case HandType.REGULAR:
            newShanten = this.shantenCalculator.calculateRegularShanten(testTileCount, meldCount).shanten;
            break;
          case HandType.CHITOITSU:
            newShanten = this.shantenCalculator.calculateChitoitsuShanten(testTileCount, hasMelds);
            break;
          case HandType.KOKUSHI:
            newShanten = this.shantenCalculator.calculateKokushiShanten(testTileCount, hasMelds);
            break;
          default:
            continue;
        }
        
        // 改善があるかチェック
        if (newShanten < minShanten) {
          details.push({
            tile: testTile,
            handType: optimal.type
          });
        }
      }
    }
  
    const effectiveTiles  =  this.deduplicateEffectiveTiles(details);
    return {
      tiles: effectiveTiles.map(detail => detail.tile),
      details: effectiveTiles,
      currentShanten: minShanten
    };
  }
  
   /**
   * 有効牌の重複を除去
   */
  private deduplicateEffectiveTiles(details: EffectiveTileDetails[]): EffectiveTileDetails[] {
    const tileMap = new Map<string, EffectiveTileDetails>();
    
    for (const detail of details) {
      const tileKey = detail.tile.toString();
      if (!tileMap.has(tileKey)) {
        tileMap.set(tileKey, detail);
      }
    }
    
    return Array.from(tileMap.values());
  }
}
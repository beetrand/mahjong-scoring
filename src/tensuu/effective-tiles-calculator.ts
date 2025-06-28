// 有効牌計算クラス

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { Component, ComponentType } from '../common/component';
import { HandType } from '../common/types';
import { ShantenCalculator, type MentsuComposition } from './shanten-calculator';
import { TILE_NAMES } from '../common/tile-constants';

/**
 * 有効牌計算結果（シンプル化）
 */
export interface EffectiveTilesResult {
  tiles: Tile[];                           // 有効牌一覧
  currentShanten: number;                  // 現在のシャンテン数
}

/**
 * コンポーネントと有効牌のセット（テンパイ時用）
 */
export interface ComponentWithEffectiveTiles {
  component: Component;                    // コンポーネント（塔子、孤立牌、対子）
  componentIndex: number;                  // 面子構成内での位置
  effectiveTiles: Tile[];                  // このコンポーネントに入る有効牌
  waitType: string;                        // 待ちタイプ（ryanmen, kanchan, penchan, tanki, shanpon）
}

/**
 * テンパイ時の面子構成と有効牌
 */
export interface TenpaiCompositionWithEffectiveTiles {
  composition: MentsuComposition;          // 面子構成
  componentsWithEffectiveTiles: ComponentWithEffectiveTiles[];  // 有効牌を持つコンポーネントのリスト
}

/**
 * テンパイ時の有効牌計算結果
 */
export interface TenpaiEffectiveTilesResult {
  compositionsWithEffectiveTiles: TenpaiCompositionWithEffectiveTiles[];
  allEffectiveTiles: Tile[];               // 重複除去済みの全有効牌
}

/**
 * 未完成部分の分析結果
 */
interface IncompleteAnalysisResult {
  componentsWithEffectiveTiles: ComponentWithEffectiveTiles[];
  allEffectiveTiles: Tile[];
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
   * シンプルな実装：全牌をテストしてシャンテン数が下がるものを選ぶ
   */
  public calculateEffectiveTiles(hand: Hand): EffectiveTilesResult {
    const effectiveTiles: Tile[] = [];
    
    // 現在のシャンテン数を計算（自摸牌除外）
    const currentShantenResult = this.shantenCalculator.calculateShanten(hand, true);
    const currentShanten = currentShantenResult.shanten;
    const handTileCount = hand.getTileCount(true);
    const meldCount = hand.getMeldCount();
    const hasMelds = hand.hasMelds();
    
    // 全牌をテスト
    const allTiles = TILE_NAMES.map(tileName => new Tile(tileName));
    
    for (const testTile of allTiles) {
      // 牌を1枚追加してテスト用手牌を作成
      const testTileCount = handTileCount.clone();
      testTileCount.addTile(testTile);
      
      // 各手牌タイプでシャンテン数を計算
      const regularShanten = this.shantenCalculator.calculateRegularShanten(testTileCount, meldCount).shanten;
      const chitoitsuShanten = this.shantenCalculator.calculateChitoitsuShanten(testTileCount, hasMelds);
      const kokushiShanten = this.shantenCalculator.calculateKokushiShanten(testTileCount, hasMelds);
      
      // 最小シャンテン数を取得
      const newShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
      
      // 改善があるかチェック
      if (newShanten < currentShanten) {
        effectiveTiles.push(testTile);
      }
    }
  
    // 重複を除去
    const uniqueEffectiveTiles = this.deduplicateTiles(effectiveTiles);
    
    return {
      tiles: uniqueEffectiveTiles,
      currentShanten: currentShanten
    };
  }
  
  /**
   * 牌の重複を除去
   */
  private deduplicateTiles(tiles: Tile[]): Tile[] {
    const tileMap = new Map<string, Tile>();
    
    for (const tile of tiles) {
      const tileKey = tile.toString();
      if (!tileMap.has(tileKey)) {
        tileMap.set(tileKey, tile);
      }
    }
    
    return Array.from(tileMap.values());
  }

  /**
   * テンパイ時の有効牌を構成面子ベースで計算
   */
  public calculateTenpaiEffectiveTiles(hand: Hand): TenpaiEffectiveTilesResult | null {
    // 現在のシャンテン数を計算
    const shantenResult = this.shantenCalculator.calculateShanten(hand, true);
    
    // テンパイでない、または通常手でない場合はnull
    if (shantenResult.shanten !== 0 || shantenResult.handType !== HandType.REGULAR || !shantenResult.optimalStates) {
      return null;
    }
    
    const compositionsWithEffectiveTiles: TenpaiCompositionWithEffectiveTiles[] = [];
    const allEffectiveTilesSet = new Set<string>();
    
    // 各面子構成について未完成部分のみを分析
    for (const composition of shantenResult.optimalStates) {
      const result = this.analyzeIncompleteComponents(composition);
      
      if (result) {
        compositionsWithEffectiveTiles.push({
          composition,
          componentsWithEffectiveTiles: result.componentsWithEffectiveTiles
        });
        
        // 全有効牌セットに追加
        result.allEffectiveTiles.forEach(tile => allEffectiveTilesSet.add(tile.toString()));
      }
    }
    
    if (compositionsWithEffectiveTiles.length === 0) {
      return null;
    }
    
    return {
      compositionsWithEffectiveTiles,
      allEffectiveTiles: Array.from(allEffectiveTilesSet).map(tileStr => new Tile(tileStr))
    };
  }

  /**
   * 特定の塔子に対する有効牌を計算
   */
  private calculateEffectiveTilesForTaatsu(taatsu: Component): Tile[] {
    const effectiveTiles: Tile[] = [];
    
    if (taatsu.tiles.length !== 2) {
      return effectiveTiles;
    }
    
    const [tile1, tile2] = taatsu.tiles;
    
    // 同じスートでない場合は計算しない
    if (tile1.suit !== tile2.suit) {
      return effectiveTiles;
    }
    
    const values = [tile1.value, tile2.value].sort((a, b) => a - b);
    
    // スートを短縮形に変換
    const suitChar = tile1.getSuitChar();
    if (!suitChar) {
      return effectiveTiles;
    }
    
    // 連続する2牌の塔子（両面塔子）
    if (values[1] - values[0] === 1) {
      // 下側の牌
      if (values[0] > 1) {
        effectiveTiles.push(new Tile((values[0] - 1).toString() + suitChar));
      }
      // 上側の牌
      if (values[1] < 9) {
        effectiveTiles.push(new Tile((values[1] + 1).toString() + suitChar));
      }
    }
    
    // 1つ飛びの塔子（嵌張塔子）
    if (values[1] - values[0] === 2) {
      effectiveTiles.push(new Tile((values[0] + 1).toString() + suitChar));
    }
    
    return effectiveTiles;
  }


  /**
   * 面子構成から未完成部分のみを抽出・分析
   * 完成面子（SEQUENCE, TRIPLET, QUAD）を除外し、テンパイパターンを特定
   */
  private analyzeIncompleteComponents(composition: MentsuComposition): IncompleteAnalysisResult | null {
    // 完成面子を除外して未完成部分のみを抽出
    const incompleteComponents = composition.components.filter(comp => 
      comp.type === ComponentType.TAATSU || 
      comp.type === ComponentType.PAIR || 
      comp.type === ComponentType.ISOLATED
    );

    if (incompleteComponents.length === 0) {
      return null; // 全て完成面子の場合（通常はありえない）
    }

    // テンパイパターンを判定
    const taatsuCount = incompleteComponents.filter(comp => comp.type === ComponentType.TAATSU).length;
    const pairCount = incompleteComponents.filter(comp => comp.type === ComponentType.PAIR).length;
    const isolatedCount = incompleteComponents.filter(comp => comp.type === ComponentType.ISOLATED).length;

    const componentsWithEffectiveTiles: ComponentWithEffectiveTiles[] = [];
    const allEffectiveTiles: Tile[] = [];

    // パターン1: 搭子1つが残る場合（搭子待ち）
    if (taatsuCount === 1 && pairCount === 1 && isolatedCount === 0) {
      const taatsu = incompleteComponents.find(comp => comp.type === ComponentType.TAATSU)!;
      const effectiveTiles = this.calculateEffectiveTilesForTaatsu(taatsu);
      const waitType = this.determineWaitTypeFromTaatsuComponent(taatsu);
      
      if (effectiveTiles.length > 0) {
        const componentIndex = composition.components.indexOf(taatsu);
        componentsWithEffectiveTiles.push({
          component: taatsu,
          componentIndex,
          effectiveTiles,
          waitType
        });
        allEffectiveTiles.push(...effectiveTiles);
      }
    }
    // パターン2: 対子2つが残る場合（シャンポン待ち）
    else if (taatsuCount === 0 && pairCount === 2 && isolatedCount === 0) {
      incompleteComponents.forEach(pair => {
        if (pair.type === ComponentType.PAIR) {
          const effectiveTiles = this.calculateEffectiveTilesForPair(pair, composition);
          
          if (effectiveTiles.length > 0) {
            const componentIndex = composition.components.indexOf(pair);
            componentsWithEffectiveTiles.push({
              component: pair,
              componentIndex,
              effectiveTiles,
              waitType: 'shanpon'
            });
            allEffectiveTiles.push(...effectiveTiles);
          }
        }
      });
    }
    // パターン3: 孤立牌1つが残る場合（単騎待ち）
    else if (taatsuCount === 0 && pairCount === 0 && isolatedCount === 1) {
      const isolated = incompleteComponents.find(comp => comp.type === ComponentType.ISOLATED)!;
      const effectiveTiles = this.calculateEffectiveTilesForIsolated(isolated);
      
      if (effectiveTiles.length > 0) {
        const componentIndex = composition.components.indexOf(isolated);
        componentsWithEffectiveTiles.push({
          component: isolated,
          componentIndex,
          effectiveTiles,
          waitType: 'tanki'
        });
        allEffectiveTiles.push(...effectiveTiles);
      }
    }

    return componentsWithEffectiveTiles.length > 0 ? {
      componentsWithEffectiveTiles,
      allEffectiveTiles: this.deduplicateTiles(allEffectiveTiles)
    } : null;
  }

  /**
   * 塔子から待ちタイプを判定（簡易版）
   */
  private determineWaitTypeFromTaatsuComponent(taatsu: Component): string {
    if (taatsu.tiles.length !== 2) {
      return '';
    }
    
    const [tile1, tile2] = taatsu.tiles;
    if (tile1.suit !== tile2.suit) {
      return '';
    }
    
    const values = [tile1.value, tile2.value].sort((a, b) => a - b);
    
    if (values[1] - values[0] === 1) {
      // 連続する塔子 - 端かどうかで判定
      if (values[0] === 1 || values[1] === 9) {
        return 'penchan';  // ペンチャン
      } else {
        return 'ryanmen';  // リャンメン
      }
    } else if (values[1] - values[0] === 2) {
      return 'kanchan';   // カンチャン
    }
    
    return '';
  }

  /**
   * 孤立牌に対する有効牌を計算（単騎待ち）
   */
  private calculateEffectiveTilesForIsolated(isolated: Component): Tile[] {
    if (isolated.tiles.length !== 1) {
      return [];
    }
    
    // 孤立牌は自分自身が有効牌（対子を作るため）
    return [isolated.tiles[0]];
  }

  /**
   * 対子に対する有効牌を計算（シャンポン待ち）
   */
  private calculateEffectiveTilesForPair(pair: Component, composition: MentsuComposition): Tile[] {
    if (pair.tiles.length !== 2 || !pair.tiles[0].equals(pair.tiles[1])) {
      return [];
    }
    
    // 対子がもう一つある場合のみシャンポン待ちになる
    const pairCount = composition.components.filter(comp => 
      comp.type === ComponentType.PAIR && 
      comp.tiles.length === 2 && 
      comp.tiles[0].equals(comp.tiles[1])
    ).length;
    
    if (pairCount >= 2) {
      // シャンポン待ち：この対子と同じ牌が有効牌
      return [pair.tiles[0]];
    }
    
    return [];
  }


}
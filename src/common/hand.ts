// 手牌クラス

import { Tile } from './tile';
import { HandParser } from './hand-parser';
import { TileCount } from './tile-count';
import { Component } from './component';
import type { HandOptions, GameContext } from './types';

export class Hand {
  public readonly tiles: Tile[];
  public readonly openMelds: Component[];
  public readonly drawnTile: Tile;      // ツモ牌（和了時は和了牌、非和了時も意味を持つ）
  public readonly isTsumo: boolean;
  public readonly isRiichi: boolean;
  public readonly gameContext: GameContext;
  
  // シャンテン計算用牌種別カウント（TileCountオブジェクト）
  public readonly tileCount: TileCount;

  constructor(tiles: Tile[], openMelds: Component[], options: HandOptions) {
    this.tiles = tiles;
    this.openMelds = openMelds;
    this.drawnTile = Tile.fromString(options.drawnTile);
    this.isTsumo = options.isTsumo;
    this.isRiichi = options.isRiichi || false;
    this.gameContext = options.gameContext;
    
    // 牌種別カウントを事前計算
    this.tileCount = this.createTileCount();
    
    // ツモ牌が手牌に含まれているか検証
    const hasDrawnTile = this.tiles.some(tile => tile.equalsIgnoreRed(this.drawnTile));
    if (!hasDrawnTile) {
      throw new Error(`Drawn tile ${this.drawnTile.toString()} not found in hand`);
    }
  }

  public calculateExpectedTileCount(): number {
    // 基本14枚から副露分を差し引く
    // カンは4枚だが3枚を差し引く（嶺上牌で補充されるため）
    let deduction = 0;
    for (const meld of this.openMelds) {
      if (meld.type === 'sequence' || meld.type === 'triplet') {
        deduction += 3;
      } else if (meld.type === 'quad') {
        deduction += 3; // カンも3枚分減らす（嶺上牌で補充）
      }
    }
    return 14 - deduction;
  }

  public getAllTiles(): Tile[] {
    const allTiles = [...this.tiles];
    // 副露面子の牌も含める
    for (const meld of this.openMelds) {
      allTiles.push(...meld.tiles);
    }
    return allTiles;
  }

  public getConcealedTiles(): Tile[] {
    return [...this.tiles];
  }

  public getConcealedTileCount(): number {
    return this.tiles.length;
  }

  public getTotalTileCount(): number {
    // 門前牌 + 副露牌の総数
    const meldTiles = this.openMelds.reduce((total, meld) => {
      return total + (meld.type === 'quad' ? 4 : 3);
    }, 0);
    return this.tiles.length + meldTiles;
  }

  public isOpenHand(): boolean {
    return this.openMelds.length > 0;
  }

  public isMenzen(): boolean {
    return this.openMelds.length === 0;
  }

  /**
   * シャンテン計算用の抽象化メソッド群
   * ShantenCalculatorが副露の詳細を知らずに済むように抽象化
   */

  /**
   * 手牌（門前牌）を取得
   * 門前牌のみを返し、副露の影響は内部で隠蔽
   */
  public getTehai(): Tile[] {
    return this.getConcealedTiles();
  }

  /**
   * 必要な面子数を取得（副露考慮）
   * 4面子1雀頭から副露面子数を差し引いた残り面子数
   */
  public getRequiredMentsuCount(): number {
    return 4 - this.openMelds.length;
  }

  /**
   * 特殊手（七対子・国士無双）が使用可能かチェック
   * 副露がある場合は特殊手は成立しない
   */
  public canUseSpecialHands(): boolean {
    return this.openMelds.length === 0;
  }

  /**
   * 副露面子数を取得
   */
  public getMeldCount(): number {
    return this.openMelds.length;
  }

  /**
   * 手牌がシャンテン計算可能な状態かチェック
   */
  public isValidForShantenCalculation(): boolean {
    const effectiveTiles = this.getTehai();
    const expectedCount = this.calculateExpectedTileCount();
    
    // 期待される牌数（13枚または14枚相当）かチェック
    return effectiveTiles.length === expectedCount || 
           effectiveTiles.length === expectedCount - 1; // ツモ前の状態も許可
  }

  /**
   * 副露があるかどうか
   */
  public hasMelds(): boolean {
    return this.openMelds.length > 0;
  }

  /**
   * シャンテン計算用の牌種別カウントを作成
   * TileCountオブジェクトとして管理
   */
  private createTileCount(): TileCount {
    const tileCount = new TileCount();
    
    // 門前牌のみをカウント（副露は除外）
    for (const tile of this.tiles) {
      tileCount.addTile(tile);
    }
    
    return tileCount;
  }

  /**
   * シャンテン計算用の牌種別カウントを取得
   */
  public getTileCount(): TileCount {
    return this.tileCount.clone(); // コピーを返して不変性を保持
  }


  public static create(tiles: Tile[], openMelds: Component[], options: HandOptions): Hand {
    return new Hand(tiles, openMelds, options);
  }

  /**
   * 文字列から手牌を作成（副露表記対応）
   * 例: "123m456p789s11z" または "123m456p11z [777p+] <234s=>"
   */
  public static fromString(handStr: string, options: HandOptions): Hand {
    const { concealed, melds } = HandParser.parseHandWithMelds(handStr);
    const tiles = HandParser.parseHandString(concealed);
    
    return new Hand(tiles, melds, options);
  }

}
// 手牌・副露の文字列解析システム

import { Tile } from './tile';
import { Component } from './component';
import type { OpenMeldType, MeldFrom } from './types';

// 方向マーカーのマッピング
const DIRECTION_MAP: Record<string, MeldFrom> = {
  '+': 'kamicha',   // 上家
  '=': 'toimen',    // 対面  
  '-': 'shimocha'   // 下家
};

// 括弧から副露タイプを判定
const BRACKET_TYPE_MAP: Record<string, OpenMeldType> = {
  '[': 'pon',     // ポン [777p+]
  '<': 'chi',     // チー <123s=>
  '(': 'minkan'   // 明槓 (1111m-)
};

/**
 * 手牌・副露の文字列解析を統一的に管理するクラス
 * 旧MeldParserの機能も包含
 */
export class HandParser {
  /**
   * 牌文字列を解析 (例: "123m456p789s1122z")
   */
  static parseHandString(handStr: string): Tile[] {
    const tiles: Tile[] = [];
    let currentNumber = '';
    
    for (let i = 0; i < handStr.length; i++) {
      const char = handStr[i];
      
      if (char >= '0' && char <= '9') {
        currentNumber += char;
      } else if (char === 'm' || char === 'p' || char === 's') {
        // 数牌の処理
        for (const numChar of currentNumber) {
          tiles.push(Tile.fromString(numChar + char));
        }
        currentNumber = '';
      } else if (char === 'z') {
        // 字牌の処理 (z記法)
        for (const numChar of currentNumber) {
          tiles.push(Tile.fromString(numChar + 'z'));
        }
        currentNumber = '';
      }
    }
    
    return tiles;
  }

  /**
   * 副露表記の文字列を解析してComponent配列を返す
   * 例: "[777p+] <123s=> (1111m-)" -> Component[]
   */
  static parseOpenMelds(meldStr: string): Component[] {
    const melds: Component[] = [];
    
    // 副露パターンを抽出: [牌+方向], <牌+方向>, (牌+方向)
    const meldPattern = /([\[<(])([^>\]\)]+)([\+=\-])([\]\)>])/g;
    let match;
    
    while ((match = meldPattern.exec(meldStr)) !== null) {
      const [, openBracket, tilesStr, direction, closeBracket] = match;
      
      // 括弧の整合性チェック
      if (!this.isValidBracketPair(openBracket, closeBracket)) {
        throw new Error(`Invalid bracket pair: ${openBracket}...${closeBracket}`);
      }
      
      // 牌の解析
      const tiles = this.parseHandString(tilesStr);
      
      // 副露タイプを判定
      const type = BRACKET_TYPE_MAP[openBracket];
      if (!type) {
        throw new Error(`Unknown meld bracket: ${openBracket}`);
      }
      
      // 方向を判定
      const from = DIRECTION_MAP[direction];
      if (!from) {
        throw new Error(`Unknown direction marker: ${direction}`);
      }
      
      // 面子タイプと牌数の検証
      this.validateMeldTiles(type, tiles);
      
      // 鳴いた牌を特定（簡略化：最初の牌とする）
      const calledTile = tiles[0];
      
      // ComponentタイプとMeldInfoを作成してComponentを生成
      let componentType;
      switch (type) {
        case 'chi':
          componentType = 'sequence' as const;
          break;
        case 'pon':
          componentType = 'triplet' as const;
          break;
        case 'minkan':
        case 'kakan':
          componentType = 'quad' as const;
          break;
        default:
          throw new Error(`Unknown meld type: ${type}`);
      }
      
      const component = Component.create(
        componentType,
        tiles.map(t => t.index),
        false, // 副露は明面子
        {
          from,
          calledTile
        }
      );
      
      melds.push(component);
    }
    
    return melds;
  }

  /**
   * 手牌文字列から門前牌と副露を分離して解析
   * 例: "123m456p11z [777p+] <234s=>" -> { concealed: "123m456p11z", melds: [...] }
   */
  static parseHandWithMelds(handStr: string): { concealed: string, melds: Component[] } {
    // 副露部分を抽出
    const meldPattern = /([\[<(])([^>\]\)]+)([\+=\-])([\]\)>])/g;
    const melds = this.parseOpenMelds(handStr);
    
    // 門前牌部分を抽出（副露部分を除去）
    const concealed = handStr.replace(meldPattern, '').trim();
    
    return { concealed, melds };
  }

  /**
   * Componentを文字列表記に変換
   */
  static componentToString(component: Component): string {
    if (!component.meldInfo) {
      throw new Error('Component must have meld info for string conversion');
    }
    
    const tilesStr = component.tiles.map(tile => tile.toString()).join('');
    const directionChar = Object.entries(DIRECTION_MAP)
      .find(([, dir]) => dir === component.meldInfo!.from)?.[0] || '+';
    
    switch (component.type) {
      case 'triplet':
        return `[${tilesStr}${directionChar}]`;
      case 'sequence':
        return `<${tilesStr}${directionChar}>`;
      case 'quad':
        return `(${tilesStr}${directionChar})`;
      default:
        throw new Error(`Unknown component type for meld: ${component.type}`);
    }
  }

  /**
   * Component配列を文字列表記に変換
   */
  static componentsToString(components: Component[]): string {
    return components.map(component => this.componentToString(component)).join(' ');
  }

  // ===== Private Helper Methods =====

  /**
   * 括弧のペアが正しいかチェック
   */
  private static isValidBracketPair(open: string, close: string): boolean {
    const pairs: Record<string, string> = {
      '[': ']',
      '<': '>',
      '(': ')'
    };
    return pairs[open] === close;
  }

  /**
   * 副露面子の牌数と種類を検証
   */
  private static validateMeldTiles(type: OpenMeldType, tiles: Tile[]): void {
    switch (type) {
      case 'chi':
        if (tiles.length !== 3) {
          throw new Error(`Chi must have 3 tiles, got ${tiles.length}`);
        }
        this.validateSequence(tiles);
        break;
        
      case 'pon':
        if (tiles.length !== 3) {
          throw new Error(`Pon must have 3 tiles, got ${tiles.length}`);
        }
        this.validateTriplet(tiles);
        break;
        
      case 'minkan':
      case 'kakan':
        if (tiles.length !== 4) {
          throw new Error(`Kan must have 4 tiles, got ${tiles.length}`);
        }
        this.validateQuad(tiles);
        break;
    }
  }

  /**
   * 順子の検証（連続する3枚の数牌）
   */
  private static validateSequence(tiles: Tile[]): void {
    if (tiles.length !== 3) return;
    
    // 同じ種類の数牌かチェック
    const suit = tiles[0].suit;
    if (suit === 'wind' || suit === 'dragon') {
      throw new Error('Chi cannot be made with honor tiles');
    }
    
    if (!tiles.every(tile => tile.suit === suit)) {
      throw new Error('Chi must be same suit');
    }
    
    // 連続する数字かチェック
    const values = tiles.map(tile => tile.value).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i-1] + 1) {
        throw new Error('Chi must be consecutive numbers');
      }
    }
  }

  /**
   * 刻子の検証（同じ牌3枚）
   */
  private static validateTriplet(tiles: Tile[]): void {
    if (tiles.length !== 3) return;
    
    const firstTile = tiles[0];
    if (!tiles.every(tile => tile.equalsIgnoreRed(firstTile))) {
      throw new Error('Pon must be same tiles');
    }
  }

  /**
   * 槓子の検証（同じ牌4枚）
   */
  private static validateQuad(tiles: Tile[]): void {
    if (tiles.length !== 4) return;
    
    const firstTile = tiles[0];
    if (!tiles.every(tile => tile.equalsIgnoreRed(firstTile))) {
      throw new Error('Kan must be same tiles');
    }
  }
}
// 副露面子の文字列解析システム

import { Tile } from './tile';
import type { OpenMeld, OpenMeldType, MeldFrom } from './types';

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

export class MeldParser {
  /**
   * 副露表記の文字列を解析してOpenMeld配列を返す
   * 例: "[777p+] <123s=> (1111m-)" -> OpenMeld[]
   */
  static parseOpenMelds(meldStr: string): OpenMeld[] {
    const melds: OpenMeld[] = [];
    
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
      const tiles = Tile.parseHandString(tilesStr);
      const tileStrings = tiles.map(tile => tile.toString());
      
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
      const calledTile = tileStrings[0];
      
      melds.push({
        tiles: tileStrings,
        type,
        from,
        calledTile,
        isConcealed: false
      });
    }
    
    return melds;
  }
  
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
  
  /**
   * 手牌文字列から門前牌と副露を分離して解析
   * 例: "123m456p11z [777p+] <234s=>" -> { concealed: "123m456p11z", melds: [...] }
   */
  static parseHandWithMelds(handStr: string): { concealed: string, melds: OpenMeld[] } {
    // 副露部分を抽出
    const meldPattern = /([\[<(])([^>\]\)]+)([\+=\-])([\]\)>])/g;
    const melds = this.parseOpenMelds(handStr);
    
    // 門前牌部分を抽出（副露部分を除去）
    const concealed = handStr.replace(meldPattern, '').trim();
    
    return { concealed, melds };
  }
  
  /**
   * OpenMeldを文字列表記に変換
   */
  static meldToString(meld: OpenMeld): string {
    const tilesStr = meld.tiles.join('');
    const directionChar = Object.entries(DIRECTION_MAP)
      .find(([, dir]) => dir === meld.from)?.[0] || '+';
    
    switch (meld.type) {
      case 'pon':
        return `[${tilesStr}${directionChar}]`;
      case 'chi':
        return `<${tilesStr}${directionChar}>`;
      case 'minkan':
      case 'kakan':
        return `(${tilesStr}${directionChar})`;
      default:
        throw new Error(`Unknown meld type: ${meld.type}`);
    }
  }
  
  /**
   * OpenMeld配列を文字列表記に変換
   */
  static meldsToString(melds: OpenMeld[]): string {
    return melds.map(meld => this.meldToString(meld)).join(' ');
  }
}
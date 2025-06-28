// 麻雀牌クラス - シンプル化されたindex中心設計

import type { TileSuit } from './types';
import { 
  getSuitFromIndex, 
  getValueFromIndex,
  tileNameToIndex,
  MAX_TILE_INDEX 
} from './tile-constants';

export class Tile {
  public readonly index: number; // 0-33のメインデータ
  public readonly isRed: boolean;

  // suitとvalueはgetterで計算（冗長なプロパティを削除）
  public get suit(): TileSuit {
    return getSuitFromIndex(this.index);
  }

  public get value(): number {
    return getValueFromIndex(this.index);
  }

  // コンストラクタ: 文字列またはindex + isRedで作成
  constructor(tileString: string);
  constructor(index: number, isRed?: boolean);
  constructor(indexOrString: number | string, isRed: boolean = false) {
    if (typeof indexOrString === 'string') {
      // 文字列からの作成
      const parsed = this.parseString(indexOrString);
      this.index = parsed.index;
      this.isRed = parsed.isRed;
    } else {
      // indexからの作成
      this.index = indexOrString;
      this.isRed = isRed;
    }
    
    this.validateTile();
  }

  private parseString(str: string): { index: number, isRed: boolean } {
    str = str.trim();
    
    // z記法の字牌の場合 (例: "1z", "7z")
    const zMatch = str.match(/^([1-7])z$/);
    if (zMatch) {
      const value = parseInt(zMatch[1]);
      if (value >= 1 && value <= 4) {
        // 1z=東, 2z=南, 3z=西, 4z=北
        return { index: tileNameToIndex(`${value}z`), isRed: false };
      } else if (value >= 5 && value <= 7) {
        // 5z=白, 6z=發, 7z=中
        return { index: tileNameToIndex(`${value}z`), isRed: false };
      }
    }

    // 数牌の場合 (例: "1m", "5pr")
    const match = str.match(/^(\d)([mps])(r?)$/);
    if (!match) {
      throw new Error(`Invalid tile string: ${str}`);
    }

    const value = parseInt(match[1]);
    const suitChar = match[2];
    const isRed = match[3] === 'r';

    // 赤ドラは5のみ
    if (isRed && value !== 5) {
      throw new Error(`Red tile must be 5, got: ${value}`);
    }

    const tileName = `${value}${suitChar}`;
    return { index: tileNameToIndex(tileName), isRed };
  }

  private validateTile(): void {
    if (this.index < 0 || this.index > MAX_TILE_INDEX) {
      throw new Error(`Invalid tile index: ${this.index}`);
    }
    
    // 赤ドラは5のみ（value = 5の数牌のみ）
    if (this.isRed) {
      if (this.isHonor()) {
        throw new Error('Honor tiles cannot be red');
      }
      if (this.value !== 5) {
        throw new Error(`Red tile must be 5, got: ${this.value}`);
      }
    }
  }

  /**
   * インデックスから牌を作成（静的メソッド）
   */
  public static fromIndex(index: number, isRed: boolean = false): Tile {
    return new Tile(index, isRed);
  }

  /**
   * 文字列から牌を作成（静的メソッド）
   */
  public static fromString(str: string): Tile {
    return new Tile(str);
  }

  /**
   * スートの短縮文字を取得（数牌のみ）
   */
  public getSuitChar(): string | null {
    switch (this.suit) {
      case 'man': return 'm';
      case 'pin': return 'p';
      case 'sou': return 's';
      default: return null; // 字牌の場合はnull
    }
  }

  public toString(): string {
    if (this.suit === 'wind') {
      return `${this.value}z`;
    } else if (this.suit === 'dragon') {
      return `${this.value + 4}z`;
    } else {
      const suitChar = this.getSuitChar();
      return `${this.value}${suitChar}${this.isRed ? 'r' : ''}`;
    }
  }

  public equals(other: Tile): boolean {
    return this.index === other.index && this.isRed === other.isRed;
  }

  public equalsIgnoreRed(other: Tile): boolean {
    return this.index === other.index;
  }

  public isTerminal(): boolean {
    if (this.isHonor()) return true;
    return this.value === 1 || this.value === 9;
  }

  public isHonor(): boolean {
    return this.suit === 'wind' || this.suit === 'dragon';
  }

  public isSimple(): boolean {
    if (this.isHonor()) return false;
    return this.value >= 2 && this.value <= 8;
  }

  public isWind(): boolean {
    return this.suit === 'wind';
  }

  public isDragon(): boolean {
    return this.suit === 'dragon';
  }

  public isNumber(): boolean {
    return this.suit === 'man' || this.suit === 'pin' || this.suit === 'sou';
  }

  // 複数の牌を文字列から作成
  public static fromStringArray(tiles: string[]): Tile[] {
    return tiles.map(tileStr => Tile.fromString(tileStr));
  }

  // ソート用比較関数（indexベースで高速化）
  public static compare(a: Tile, b: Tile): number {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    // 同じ牌の場合、赤ドラを優先（ソート時に先頭に来る）
    return a.isRed ? -1 : (b.isRed ? 1 : 0);
  }
}
// 麻雀牌クラス

import { TileSuit } from './types';

export class Tile {
  public readonly suit: TileSuit;
  public readonly value: number;
  public readonly isRed: boolean;

  constructor(suit: TileSuit, value: number, isRed: boolean = false) {
    this.suit = suit;
    this.value = value;
    this.isRed = isRed;
    
    // バリデーション
    this.validateTile();
  }

  private validateTile(): void {
    if (this.suit === 'man' || this.suit === 'pin' || this.suit === 'sou') {
      if (this.value < 1 || this.value > 9) {
        throw new Error(`Invalid number tile value: ${this.value}`);
      }
      // 赤ドラは5のみ
      if (this.isRed && this.value !== 5) {
        throw new Error(`Red tile must be 5, got: ${this.value}`);
      }
    } else if (this.suit === 'wind') {
      if (this.value < 1 || this.value > 4) {
        throw new Error(`Invalid wind tile value: ${this.value}`);
      }
    } else if (this.suit === 'dragon') {
      if (this.value < 1 || this.value > 3) {
        throw new Error(`Invalid dragon tile value: ${this.value}`);
      }
    }
  }

  public toString(): string {
    if (this.suit === 'wind') {
      return `${this.value}z`;
    } else if (this.suit === 'dragon') {
      return `${this.value + 4}z`;
    } else {
      const suitChar = this.suit === 'man' ? 'm' : 
                       this.suit === 'pin' ? 'p' : 's';
      return `${this.value}${suitChar}${this.isRed ? 'r' : ''}`;
    }
  }


  public equals(other: Tile): boolean {
    return this.suit === other.suit && 
           this.value === other.value && 
           this.isRed === other.isRed;
  }

  public equalsIgnoreRed(other: Tile): boolean {
    return this.suit === other.suit && this.value === other.value;
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

  // 文字列から牌を作成
  public static fromString(str: string): Tile {
    str = str.trim();
    
    // z記法の字牌の場合 (例: "1z", "7z")
    const zMatch = str.match(/^([1-7])z$/);
    if (zMatch) {
      const value = parseInt(zMatch[1]);
      if (value >= 1 && value <= 4) {
        // 1z=東, 2z=南, 3z=西, 4z=北
        return new Tile('wind', value);
      } else if (value >= 5 && value <= 7) {
        // 5z=白, 6z=發, 7z=中
        return new Tile('dragon', value - 4);
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

    const suitMap: { [key: string]: TileSuit } = {
      'm': 'man',
      'p': 'pin',
      's': 'sou'
    };

    const suit = suitMap[suitChar];
    return new Tile(suit, value, isRed);
  }

  // 複数の牌を文字列から作成
  public static fromStringArray(tiles: string[]): Tile[] {
    return tiles.map(tileStr => Tile.fromString(tileStr));
  }

  // 牌文字列を解析 (例: "123m456p789s1122z")
  public static parseHandString(handStr: string): Tile[] {
    const tiles: Tile[] = [];
    let currentNumber = '';
    
    for (let i = 0; i < handStr.length; i++) {
      const char = handStr[i];
      
      if (char >= '0' && char <= '9') {
        currentNumber += char;
      } else if (char === 'm' || char === 'p' || char === 's') {
        // 数牌の処理
        for (const numChar of currentNumber) {
          const value = parseInt(numChar);
          const suitMap: { [key: string]: TileSuit } = {
            'm': 'man', 'p': 'pin', 's': 'sou'
          };
          tiles.push(new Tile(suitMap[char], value));
        }
        currentNumber = '';
      } else if (char === 'z') {
        // 字牌の処理 (z記法)
        for (const numChar of currentNumber) {
          const value = parseInt(numChar);
          if (value >= 1 && value <= 4) {
            // 1z=東, 2z=南, 3z=西, 4z=北
            tiles.push(new Tile('wind', value));
          } else if (value >= 5 && value <= 7) {
            // 5z=白, 6z=發, 7z=中
            tiles.push(new Tile('dragon', value - 4));
          }
        }
        currentNumber = '';
      }
    }
    
    return tiles;
  }

  // ソート用比較関数
  public static compare(a: Tile, b: Tile): number {
    if (a.suit !== b.suit) {
      const suitOrder = ['man', 'pin', 'sou', 'wind', 'dragon'] as const;
      return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    }
    if (a.value !== b.value) {
      return a.value - b.value;
    }
    return a.isRed ? -1 : (b.isRed ? 1 : 0);
  }
}
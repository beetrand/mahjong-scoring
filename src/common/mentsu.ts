// 麻雀面子クラス

import { Tile } from './tile';
import { MentsuType } from './types';
import type { FuContext } from './types';

export class Mentsu {
  public readonly tiles: Tile[];
  public readonly type: MentsuType;
  public readonly isConcealed: boolean;

  constructor(tiles: Tile[], type: MentsuType, isConcealed: boolean = true) {
    this.tiles = [...tiles].sort(Tile.compare);
    this.type = type;
    this.isConcealed = isConcealed;
    
    this.validateMentsu();
  }

  private validateMentsu(): void {
    switch (this.type) {
      case 'sequence':
        if (this.tiles.length !== 3) {
          throw new Error('Sequence must have exactly 3 tiles');
        }
        this.validateSequence();
        break;
      case 'triplet':
        if (this.tiles.length !== 3) {
          throw new Error('Triplet must have exactly 3 tiles');
        }
        this.validateTriplet();
        break;
      case 'quad':
        if (this.tiles.length !== 4) {
          throw new Error('Quad must have exactly 4 tiles');
        }
        this.validateQuad();
        break;
      case 'pair':
        if (this.tiles.length !== 2) {
          throw new Error('Pair must have exactly 2 tiles');
        }
        this.validatePair();
        break;
    }
  }

  private validateSequence(): void {
    const tiles = this.tiles;
    
    // すべて同じスートかチェック
    const suits = new Set(tiles.map(t => t.suit));
    if (suits.size !== 1) {
      throw new Error('Sequence tiles must be of the same suit');
    }
    
    // 字牌は順子にならない
    const suit = tiles[0].suit;
    if (suit === 'wind' || suit === 'dragon') {
      throw new Error('Honor tiles cannot form a sequence');
    }
    
    // 連続しているかチェック
    const values = tiles.map(t => t.value).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i-1] + 1) {
        throw new Error('Sequence tiles must be consecutive');
      }
    }
  }

  private validateTriplet(): void {
    const firstTile = this.tiles[0];
    if (!this.tiles.every(t => t.equals(firstTile))) {
      throw new Error('Triplet tiles must be identical');
    }
  }

  private validateQuad(): void {
    const firstTile = this.tiles[0];
    if (!this.tiles.every(t => t.equals(firstTile))) {
      throw new Error('Quad tiles must be identical');
    }
  }

  private validatePair(): void {
    if (!this.tiles[0].equals(this.tiles[1])) {
      throw new Error('Pair tiles must be identical');
    }
  }

  // 符計算
  public getFu(context: FuContext): number {
    const tile = this.getTileValue();
    
    switch (this.type) {
      case 'sequence':
        return 0; // 順子は0符
        
      case 'triplet':
        if (tile.isTerminal() || tile.isHonor()) {
          // 幺九牌: 暗刻8符、明刻4符
          return this.isConcealed ? 8 : 4;
        } else {
          // 中張牌: 暗刻4符、明刻2符
          return this.isConcealed ? 4 : 2;
        }
        
      case 'quad':
        if (tile.isTerminal() || tile.isHonor()) {
          // 幺九牌: 暗槓32符、明槓16符
          return this.isConcealed ? 32 : 16;
        } else {
          // 中張牌: 暗槓16符、明槓8符
          return this.isConcealed ? 16 : 8;
        }
        
      case 'pair':
        // 役牌の雀頭は2符
        if (tile.suit === 'wind') {
          const windValue = tile.value as 1 | 2 | 3 | 4;
          if (windValue === context.gameContext.roundWind || windValue === context.gameContext.playerWind) {
            return 2;
          }
        }
        if (tile.suit === 'dragon') {
          return 2; // 三元牌は常に役牌
        }
        return 0;
        
      default:
        return 0;
    }
  }

  // 面子の代表牌を取得
  public getTileValue(): Tile {
    return this.tiles[0];
  }

  // 幺九牌かどうか
  public isTerminalOrHonor(): boolean {
    return this.tiles[0].isTerminal() || this.tiles[0].isHonor();
  }

  // 中張牌かどうか
  public isSimple(): boolean {
    return this.tiles[0].isSimple();
  }

  // 静的ファクトリメソッド
  public static createSequence(tiles: [Tile, Tile, Tile], isConcealed: boolean = true): Mentsu {
    return new Mentsu(tiles, 'sequence', isConcealed);
  }

  public static createTriplet(tiles: [Tile, Tile, Tile], isConcealed: boolean = true): Mentsu {
    return new Mentsu(tiles, 'triplet', isConcealed);
  }

  public static createQuad(tiles: [Tile, Tile, Tile, Tile], isConcealed: boolean = true): Mentsu {
    return new Mentsu(tiles, 'quad', isConcealed);
  }

  public static createPair(tiles: [Tile, Tile]): Mentsu {
    return new Mentsu(tiles, 'pair', true); // 対子は常に暗
  }

  public static fromTiles(tiles: Tile[], isConcealed: boolean = true): Mentsu {
    if (tiles.length === 0) {
      throw new Error('Cannot create meld from empty tiles');
    }

    const sortedTiles = [...tiles].sort(Tile.compare);

    switch (sortedTiles.length) {
      case 2:
        return Mentsu.createPair([sortedTiles[0], sortedTiles[1]]);

      case 3:
        // 刻子か順子かを判定
        if (sortedTiles[0].equals(sortedTiles[1]) && sortedTiles[1].equals(sortedTiles[2])) {
          return Mentsu.createTriplet([sortedTiles[0], sortedTiles[1], sortedTiles[2]], isConcealed);
        } else {
          return Mentsu.createSequence([sortedTiles[0], sortedTiles[1], sortedTiles[2]], isConcealed);
        }

      case 4:
        return Mentsu.createQuad([sortedTiles[0], sortedTiles[1], sortedTiles[2], sortedTiles[3]], isConcealed);

      default:
        throw new Error(`Invalid number of tiles for meld: ${sortedTiles.length}`);
    }
  }

  // 役牌の対子かどうか
  public isValuePair(): boolean {
    if (this.type !== 'pair') {
      return false;
    }
    
    const tile = this.getTileValue();
    return tile.suit === 'wind' || tile.suit === 'dragon';
  }

  public toString(): string {
    const typeStr = {
      'sequence': '順子',
      'triplet': '刻子',
      'quad': '槓子',
      'pair': '対子'
    }[this.type];
    
    const concealedStr = this.isConcealed ? '暗' : '明';
    const tilesStr = this.tiles.map(t => t.toString()).join('');
    
    return `${concealedStr}${typeStr}(${tilesStr})`;
  }
}
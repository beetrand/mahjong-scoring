// 麻雀 Component クラス - 面子と残り牌の統一表現

import { Tile } from './tile';
import { indexToTileName } from './tile-constants';
import type { FuContext, WaitType } from './types';

export const ComponentType = {
  SEQUENCE: 'sequence',    // 順子 (123)
  TRIPLET: 'triplet',      // 刻子 (111)
  QUAD: 'quad',            // 槓子 (1111)
  PAIR: 'pair',            // 対子 (11)
  TAATSU: 'taatsu',        // 搭子 (12, 13など)
  ISOLATED: 'isolated'     // 孤立牌 (1)
} as const;

export type ComponentType = typeof ComponentType[keyof typeof ComponentType];

/**
 * 麻雀の面子・搭子・孤立牌を統一表現するクラス
 * バックトラッキングでの効率的な操作をサポート
 */
export class Component {
  public readonly tiles: Tile[];
  public readonly type: ComponentType;
  public readonly isConcealed: boolean;

  constructor(tiles: Tile[], type: ComponentType, isConcealed: boolean = true) {
    this.tiles = [...tiles].sort(Tile.compare);
    this.type = type;
    this.isConcealed = isConcealed;
    
    this.validateComponent();
  }

  private validateComponent(): void {
    switch (this.type) {
      case ComponentType.SEQUENCE:
        this.validateSequence();
        break;
      case ComponentType.TRIPLET:
        this.validateTriplet();
        break;
      case ComponentType.QUAD:
        this.validateQuad();
        break;
      case ComponentType.PAIR:
        this.validatePair();
        break;
      case ComponentType.TAATSU:
        this.validateTaatsu();
        break;
      case ComponentType.ISOLATED:
        this.validateIsolated();
        break;
    }
  }

  private validateSequence(): void {
    if (this.tiles.length !== 3) {
      throw new Error('Sequence must have exactly 3 tiles');
    }
    
    const suits = new Set(this.tiles.map(t => t.suit));
    if (suits.size !== 1) {
      throw new Error('Sequence tiles must be of the same suit');
    }
    
    const suit = this.tiles[0].suit;
    if (suit === 'wind' || suit === 'dragon') {
      throw new Error('Honor tiles cannot form a sequence');
    }
    
    const values = this.tiles.map(t => t.value).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i-1] + 1) {
        throw new Error('Sequence tiles must be consecutive');
      }
    }
  }

  private validateTriplet(): void {
    if (this.tiles.length !== 3) {
      throw new Error('Triplet must have exactly 3 tiles');
    }
    const firstTile = this.tiles[0];
    if (!this.tiles.every(t => t.equals(firstTile))) {
      throw new Error('Triplet tiles must be identical');
    }
  }

  private validateQuad(): void {
    if (this.tiles.length !== 4) {
      throw new Error('Quad must have exactly 4 tiles');
    }
    const firstTile = this.tiles[0];
    if (!this.tiles.every(t => t.equals(firstTile))) {
      throw new Error('Quad tiles must be identical');
    }
  }

  private validatePair(): void {
    if (this.tiles.length !== 2) {
      throw new Error('Pair must have exactly 2 tiles');
    }
    if (!this.tiles[0].equals(this.tiles[1])) {
      throw new Error('Pair tiles must be identical');
    }
  }

  private validateTaatsu(): void {
    if (this.tiles.length !== 2) {
      throw new Error('Taatsu must have exactly 2 tiles');
    }
    
    const suit = this.tiles[0].suit;
    if (suit === 'wind' || suit === 'dragon') {
      throw new Error('Honor tiles cannot form taatsu');
    }
    
    if (!this.tiles.every(t => t.suit === suit)) {
      throw new Error('Taatsu tiles must be of the same suit');
    }
    
    const values = this.tiles.map(t => t.value).sort((a, b) => a - b);
    const gap = values[1] - values[0];
    if (gap !== 1 && gap !== 2) {
      throw new Error('Taatsu must be adjacent (gap=1) or separated by one (gap=2)');
    }
  }

  private validateIsolated(): void {
    if (this.tiles.length !== 1) {
      throw new Error('Isolated must have exactly 1 tile');
    }
  }

  // 符計算（面子のみ）
  public getFu(context: FuContext): number {
    if (!this.isMentsu()) {
      return 0; // 搭子・孤立牌は符なし
    }

    const tile = this.getTileValue();
    
    switch (this.type) {
      case ComponentType.SEQUENCE:
        return 0; // 順子は0符
        
      case ComponentType.TRIPLET:
        if (tile.isTerminal() || tile.isHonor()) {
          return this.isConcealed ? 8 : 4;
        } else {
          return this.isConcealed ? 4 : 2;
        }
        
      case ComponentType.QUAD:
        if (tile.isTerminal() || tile.isHonor()) {
          return this.isConcealed ? 32 : 16;
        } else {
          return this.isConcealed ? 16 : 8;
        }
        
      case ComponentType.PAIR:
        if (tile.suit === 'wind') {
          const windValue = tile.value as 1 | 2 | 3 | 4;
          if (windValue === context.gameContext.roundWind || windValue === context.gameContext.playerWind) {
            return 2;
          }
        }
        if (tile.suit === 'dragon') {
          return 2;
        }
        return 0;
        
      default:
        return 0;
    }
  }

  // 代表牌を取得
  public getTileValue(): Tile {
    return this.tiles[0];
  }

  // 面子かどうか（順子・刻子・槓子・対子）
  public isMentsu(): boolean {
    return this.type === ComponentType.SEQUENCE || 
           this.type === ComponentType.TRIPLET || 
           this.type === ComponentType.QUAD || 
           this.type === ComponentType.PAIR;
  }

  // 完成した面子かどうか（順子・刻子・槓子）
  public isCompleteMentsu(): boolean {
    return this.type === ComponentType.SEQUENCE || 
           this.type === ComponentType.TRIPLET || 
           this.type === ComponentType.QUAD;
  }

  // 幺九牌かどうか
  public isTerminalOrHonor(): boolean {
    return this.tiles[0].isTerminal() || this.tiles[0].isHonor();
  }

  // 中張牌かどうか
  public isSimple(): boolean {
    return this.tiles[0].isSimple();
  }

  // 役牌の対子かどうか
  public isValuePair(): boolean {
    if (this.type !== ComponentType.PAIR) {
      return false;
    }
    
    const tile = this.getTileValue();
    return tile.suit === 'wind' || tile.suit === 'dragon';
  }

  // 汎用的な静的ファクトリメソッド
  public static create(type: ComponentType, indices: number[], isConcealed: boolean = true): Component {
    const tiles = indices.map(index => Component.createTileFromIndex(index));
    return new Component(tiles, type, isConcealed);
  }

  // インデックスからTileオブジェクトを作成（静的メソッド）
  private static createTileFromIndex(index: number): Tile {
    return Tile.fromString(indexToTileName(index));
  }

  // 既存の型特化ファクトリメソッド（互換性のため残す）
  public static createSequence(tiles: [Tile, Tile, Tile], isConcealed: boolean = true): Component {
    return new Component(tiles, ComponentType.SEQUENCE, isConcealed);
  }

  public static createTriplet(tiles: [Tile, Tile, Tile], isConcealed: boolean = true): Component {
    return new Component(tiles, ComponentType.TRIPLET, isConcealed);
  }

  public static createQuad(tiles: [Tile, Tile, Tile, Tile], isConcealed: boolean = true): Component {
    return new Component(tiles, ComponentType.QUAD, isConcealed);
  }

  public static createPair(tiles: [Tile, Tile]): Component {
    return new Component(tiles, ComponentType.PAIR, true);
  }

  public static createTaatsu(tiles: [Tile, Tile]): Component {
    return new Component(tiles, ComponentType.TAATSU, true);
  }

  public static createIsolated(tile: Tile): Component {
    return new Component([tile], ComponentType.ISOLATED, true);
  }

  public static fromTiles(tiles: Tile[], isConcealed: boolean = true): Component {
    if (tiles.length === 0) {
      throw new Error('Cannot create component from empty tiles');
    }

    const sortedTiles = [...tiles].sort(Tile.compare);

    switch (sortedTiles.length) {
      case 1:
        return Component.createIsolated(sortedTiles[0]);

      case 2:
        // 対子かターツかを判定
        if (sortedTiles[0].equals(sortedTiles[1])) {
          return Component.createPair([sortedTiles[0], sortedTiles[1]]);
        } else {
          return Component.createTaatsu([sortedTiles[0], sortedTiles[1]]);
        }

      case 3:
        // 刻子か順子かを判定
        if (sortedTiles[0].equals(sortedTiles[1]) && sortedTiles[1].equals(sortedTiles[2])) {
          return Component.createTriplet([sortedTiles[0], sortedTiles[1], sortedTiles[2]], isConcealed);
        } else {
          return Component.createSequence([sortedTiles[0], sortedTiles[1], sortedTiles[2]], isConcealed);
        }

      case 4:
        return Component.createQuad([sortedTiles[0], sortedTiles[1], sortedTiles[2], sortedTiles[3]], isConcealed);

      default:
        throw new Error(`Invalid number of tiles for component: ${sortedTiles.length}`);
    }
  }

  public toString(): string {
    const typeStr = {
      [ComponentType.SEQUENCE]: '順子',
      [ComponentType.TRIPLET]: '刻子',
      [ComponentType.QUAD]: '槓子',
      [ComponentType.PAIR]: '対子',
      [ComponentType.TAATSU]: '搭子',
      [ComponentType.ISOLATED]: '孤立'
    }[this.type];
    
    const tilesStr = this.tiles.map(t => t.toString()).join('');
    
    // 完成した面子（順子・刻子・槓子）のみ暗/明を表示
    if (this.isCompleteMentsu()) {
      const concealedStr = this.isConcealed ? '暗' : '明';
      return `${concealedStr}${typeStr}(${tilesStr})`;
    } else {
      // 対子・搭子・孤立牌は暗/明の概念がない
      return `${typeStr}(${tilesStr})`;
    }
  }
}

/**
 * ComponentCombination - MentsuCombinationの代替
 */
export interface ComponentCombination {
  melds: Component[];
  pair: Component;
  waitType: WaitType;
}

/**
 * Component配列のスタック管理クラス
 * バックトラッキングでの効率的なpush/pop操作をサポート
 */
export class ComponentStack {
  private components: Component[] = [];

  public push(component: Component): void {
    this.components.push(component);
  }

  public pop(): Component | undefined {
    return this.components.pop();
  }

  public peek(): Component | undefined {
    return this.components[this.components.length - 1];
  }

  public length(): number {
    return this.components.length;
  }

  public getComponents(): Component[] {
    return [...this.components];
  }

  public clear(): void {
    this.components.length = 0;
  }

  public clone(): ComponentStack {
    const newStack = new ComponentStack();
    newStack.components = [...this.components];
    return newStack;
  }

  public getMentsuCount(): number {
    return this.components.filter(c => c.isCompleteMentsu()).length;
  }

  public getPairCount(): number {
    return this.components.filter(c => c.type === ComponentType.PAIR).length;
  }

  public getTaatsuCount(): number {
    return this.components.filter(c => c.type === ComponentType.TAATSU).length;
  }

  public getIsolatedCount(): number {
    return this.components.filter(c => c.type === ComponentType.ISOLATED).length;
  }

  public toString(): string {
    return this.components.map(c => c.toString()).join(' ');
  }
}
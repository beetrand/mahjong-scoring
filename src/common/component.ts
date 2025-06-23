// 麻雀 Component クラス - 面子と残り牌の統一表現

import { Tile } from './tile';
import { indexToTileName } from './tile-constants';
import type { MeldFrom } from './types';

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
 * 副露情報を保持するインターフェース
 */
export interface MeldInfo {
  from: MeldFrom;        // 鳴いた相手
  calledTile: Tile;      // 鳴いた牌
}

/**
 * 麻雀の面子・搭子・孤立牌を統一表現するクラス
 * バックトラッキングでの効率的な操作をサポート
 */
export class Component {
  public readonly tiles: Tile[];
  public readonly type: ComponentType;
  public readonly isConcealed: boolean;
  public readonly meldInfo?: MeldInfo;  // 副露情報（副露の場合のみ）

  constructor(tiles: Tile[], type: ComponentType, isConcealed: boolean = true, meldInfo?: MeldInfo) {
    this.tiles = [...tiles].sort(Tile.compare);
    this.type = type;
    this.isConcealed = isConcealed;
    this.meldInfo = meldInfo;
    
    // 副露の場合は必ずmeldInfoが必要
    if (!isConcealed && !meldInfo) {
      throw new Error('Open meld must have meld info');
    }
    
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
  public static create(type: ComponentType, indices: number[], isConcealed: boolean = true, meldInfo?: MeldInfo): Component {
    const tiles = indices.map(index => Component.createTileFromIndex(index));
    return new Component(tiles, type, isConcealed, meldInfo);
  }

  // インデックスからTileオブジェクトを作成（静的メソッド）
  private static createTileFromIndex(index: number): Tile {
    return Tile.fromString(indexToTileName(index));
  }

  // 既存の型特化ファクトリメソッド（互換性のため残す）
  public static createSequence(tiles: [Tile, Tile, Tile], isConcealed: boolean = true, meldInfo?: MeldInfo): Component {
    return new Component(tiles, ComponentType.SEQUENCE, isConcealed, meldInfo);
  }

  public static createTriplet(tiles: [Tile, Tile, Tile], isConcealed: boolean = true, meldInfo?: MeldInfo): Component {
    return new Component(tiles, ComponentType.TRIPLET, isConcealed, meldInfo);
  }

  public static createQuad(tiles: [Tile, Tile, Tile, Tile], isConcealed: boolean = true, meldInfo?: MeldInfo): Component {
    return new Component(tiles, ComponentType.QUAD, isConcealed, meldInfo);
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

  /**
   * 他のComponentと等価かどうかを比較
   */
  public equals(other: Component): boolean {
    if (this.type !== other.type) return false;
    if (this.isConcealed !== other.isConcealed) return false;
    if (this.tiles.length !== other.tiles.length) return false;
    
    // タイルが全て同じかチェック（ソート済み前提）
    for (let i = 0; i < this.tiles.length; i++) {
      if (!this.tiles[i].equals(other.tiles[i])) return false;
    }
    
    return true;
  }

  /**
   * Component配列の比較（順序無視）
   */
  public static areComponentArraysEqual(arr1: Component[], arr2: Component[]): boolean {
    if (arr1.length !== arr2.length) return false;
    
    // 各Componentをソートしてから比較
    const sorted1 = [...arr1].sort(Component.compare);
    const sorted2 = [...arr2].sort(Component.compare);
    
    for (let i = 0; i < sorted1.length; i++) {
      if (!sorted1[i].equals(sorted2[i])) return false;
    }
    
    return true;
  }

  /**
   * Component配列の正規化（ソート）のための比較関数
   */
  public static compare(a: Component, b: Component): number {
    // 1. タイプ順
    const typeOrder = {
      [ComponentType.SEQUENCE]: 0,
      [ComponentType.TRIPLET]: 1,
      [ComponentType.QUAD]: 2,
      [ComponentType.PAIR]: 3,
      [ComponentType.TAATSU]: 4,
      [ComponentType.ISOLATED]: 5
    };
    
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    
    // 2. 最初のタイル順
    const tileDiff = Tile.compare(a.tiles[0], b.tiles[0]);
    if (tileDiff !== 0) return tileDiff;
    
    // 3. 暗/明順（暗が先）
    if (a.isConcealed !== b.isConcealed) {
      return a.isConcealed ? -1 : 1;
    }
    
    return 0;
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
 * ComponentCombination - 完全な和了形を表現
 * シンプルなComponent配列と和了牌の情報のみ
 */
export interface ComponentCombination {
  components: Component[];  // 全ての面子と対子（門前・副露の区別はComponent.isConcealedで管理）
  winningTile: Tile;       // 和了牌
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
// 34種類の牌の枚数を管理するクラス

import { Tile } from './tile';
import { TileSuit } from './types';
import { SUIT_RANGES, MAX_TILE_INDEX } from './tile-constants';

/**
 * 34種類の麻雀牌の枚数を管理するクラス
 * インデックス: 0-8(萬子), 9-17(筒子), 18-26(索子), 27-33(字牌)
 */
export class TileCount {
  private counts: number[];

  constructor(counts?: number[]) {
    if (counts) {
      if (counts.length !== MAX_TILE_INDEX + 1) {
        throw new Error(`TileCount must have exactly ${MAX_TILE_INDEX + 1} elements`);
      }
      this.counts = [...counts];
    } else {
      this.counts = new Array(MAX_TILE_INDEX + 1).fill(0);
    }
  }

  /**
   * 指定したインデックスの枚数を取得
   */
  getCount(index: number): number {
    if (index < 0 || index > MAX_TILE_INDEX) {
      throw new Error(`Invalid tile index: ${index}`);
    }
    return this.counts[index];
  }

  /**
   * 指定した牌オブジェクトの枚数を取得
   */
  getCountByTile(tile: Tile): number {
    return this.counts[this.getTileIndex(tile)];
  }

  /**
   * 指定した牌の枚数を設定
   */
  setCount(tile: Tile, count: number): void {
    this.validateCount(count);
    this.counts[this.getTileIndex(tile)] = count;
  }

  /**
   * 指定したインデックスの枚数を設定
   */
  setCountByIndex(index: number, count: number): void {
    if (index < 0 || index > MAX_TILE_INDEX) {
      throw new Error(`Invalid tile index: ${index}`);
    }
    this.validateCount(count);
    this.counts[index] = count;
  }

  /**
   * 指定した牌を1枚追加
   */
  addTile(tile: Tile): void {
    const index = this.getTileIndex(tile);
    const newCount = this.counts[index] + 1;
    this.validateCount(newCount);
    this.counts[index] = newCount;
  }

  /**
   * 指定した牌を1枚削除
   */
  removeTile(tile: Tile): boolean {
    const index = this.getTileIndex(tile);
    if (this.counts[index] > 0) {
      this.counts[index]--;
      return true;
    }
    return false;
  }

  /**
   * 指定した牌を複数枚削除
   */
  removeTiles(tile: Tile, count: number): boolean {
    const index = this.getTileIndex(tile);
    if (this.counts[index] >= count) {
      this.counts[index] -= count;
      return true;
    }
    return false;
  }

  /**
   * 他のTileCountを加算して新しいTileCountを返す
   */
  add(other: TileCount): TileCount {
    const result = new TileCount();
    for (let i = 0; i <= MAX_TILE_INDEX; i++) {
      result.counts[i] = this.counts[i] + other.counts[i];
      if(result.counts[i] > 4){
        throw Error("tile count must be less than 5.")
      } 
    }
    return result;
  }

  /**
   * 指定インデックスの枚数を増やす
   */
  increment(index: number, delta: number = 1): void {
    if (index < 0 || index > MAX_TILE_INDEX) {
      throw new Error(`Invalid tile index: ${index}`);
    }
    const newCount = this.counts[index] + delta;
    this.validateCount(newCount);
    this.counts[index] = newCount;
  }

  /**
   * 指定インデックスの枚数を減らす
   */
  decrement(index: number, delta: number = 1): void {
    if (index < 0 || index > MAX_TILE_INDEX) {
      throw new Error(`Invalid tile index: ${index}`);
    }
    const newCount = this.counts[index] - delta;
    this.validateCount(newCount);
    this.counts[index] = newCount;
  }

  /**
   * 萬子の枚数配列を取得 (0-8)
   */
  getManCounts(): number[] {
    return this.counts.slice(SUIT_RANGES.MAN.start, SUIT_RANGES.MAN.end + 1);
  }

  /**
   * 筒子の枚数配列を取得 (9-17)
   */
  getPinCounts(): number[] {
    return this.counts.slice(SUIT_RANGES.PIN.start, SUIT_RANGES.PIN.end + 1);
  }

  /**
   * 索子の枚数配列を取得 (18-26)
   */
  getSouCounts(): number[] {
    return this.counts.slice(SUIT_RANGES.SOU.start, SUIT_RANGES.SOU.end + 1);
  }

  /**
   * 字牌の枚数配列を取得 (27-33)
   */
  getHonorCounts(): number[] {
    return this.counts.slice(SUIT_RANGES.HONOR.start, SUIT_RANGES.HONOR.end + 1);
  }

  /**
   * 指定したスートの枚数配列を取得
   */
  getSuitCounts(suit: TileSuit): number[] {
    switch (suit) {
      case TileSuit.MAN:
        return this.getManCounts();
      case TileSuit.PIN:
        return this.getPinCounts();
      case TileSuit.SOU:
        return this.getSouCounts();
      case TileSuit.WIND:
      case TileSuit.DRAGON:
        return this.getHonorCounts();
      default:
        throw new Error(`Unknown suit: ${suit}`);
    }
  }

  /**
   * 全ての枚数配列を取得（互換性用）
   */
  toArray(): number[] {
    return [...this.counts];
  }

  /**
   * コピーを作成
   */
  clone(): TileCount {
    return new TileCount(this.counts);
  }

  /**
   * 全ての牌の総数を取得
   */
  getTotalCount(): number {
    return this.counts.reduce((sum, count) => sum + count, 0);
  }

  /**
   * 対子の数をカウント
   */
  countToitsu(): number {
    return this.counts.filter(count => count >= 2).length;
  }

  /**
   * 指定した枚数以上の牌の種類数をカウント
   */
  countTilesWithAtLeast(minCount: number): number {
    return this.counts.filter(count => count >= minCount).length;
  }

  /**
   * 個別の牌の枚数をバリデーション
   */
  private validateCount(count: number): void {
    if (count < 0) {
      throw new Error('Count cannot be negative');
    }
    if (count > 4) {
      throw new Error('Count cannot exceed 4 (maximum tiles per type)');
    }
  }

  /**
   * 全体の牌配置をバリデーション
   */
  validate(): void {
    // 個別の牌の枚数チェック
    for (let i = 0; i <= MAX_TILE_INDEX; i++) {
      this.validateCount(this.counts[i]);
    }

    // 総枚数チェック（通常14枚または13枚）
    const total = this.getTotalCount();
    if (total > 14) {
      throw new Error(`Total tile count ${total} exceeds maximum of 14`);
    }

    // 各牌タイプの総数チェック（赤ドラ考慮で最大4枚）
    for (let i = 0; i <= MAX_TILE_INDEX; i++) {
      if (this.counts[i] > 4) {
        throw new Error(`Tile at index ${i} has ${this.counts[i]} tiles, maximum is 4`);
      }
    }
  }

  /**
   * 牌からインデックスを取得
   */
  private getTileIndex(tile: Tile): number {
    switch (tile.suit) {
      case TileSuit.MAN:
        return SUIT_RANGES.MAN.start + tile.value - 1;
      case TileSuit.PIN:
        return SUIT_RANGES.PIN.start + tile.value - 1;
      case TileSuit.SOU:
        return SUIT_RANGES.SOU.start + tile.value - 1;
      case TileSuit.WIND:
        return SUIT_RANGES.HONOR.start + tile.value - 1;
      case TileSuit.DRAGON:
        return SUIT_RANGES.HONOR.start + 4 + tile.value - 1; // 4 wind tiles before dragons
      default:
        throw new Error(`Unknown tile suit: ${tile.suit}`);
    }
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    const parts: string[] = [];
    
    // 萬子
    const manCounts = this.getManCounts();
    if (manCounts.some(c => c > 0)) {
      parts.push(`萬: ${manCounts.join(',')}`);
    }
    
    // 筒子
    const pinCounts = this.getPinCounts();
    if (pinCounts.some(c => c > 0)) {
      parts.push(`筒: ${pinCounts.join(',')}`);
    }
    
    // 索子
    const souCounts = this.getSouCounts();
    if (souCounts.some(c => c > 0)) {
      parts.push(`索: ${souCounts.join(',')}`);
    }
    
    // 字牌
    const honorCounts = this.getHonorCounts();
    if (honorCounts.some(c => c > 0)) {
      parts.push(`字: ${honorCounts.join(',')}`);
    }
    
    return `TileCount[${parts.join(', ')}]`;
  }
}
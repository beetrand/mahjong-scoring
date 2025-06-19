// 手牌解析クラス

import { Tile } from '../common/tile';
import { Mentsu } from '../common/mentsu';
import { WaitType } from '../common/types';

export interface MentsuCombination {
  melds: Mentsu[];
  pair: Mentsu;
  waitType: WaitType;
}

export interface HandAnalysisOptions {
  winningTile?: Tile;
}

export class HandAnalyzer {
  
  // 手牌から全ての可能な面子組み合わせを取得
  public findAllMentsuCombinations(tiles: Tile[], options: HandAnalysisOptions = {}): MentsuCombination[] {
    if (tiles.length !== 14) {
      throw new Error(`Hand must have exactly 14 tiles, got ${tiles.length}`);
    }

    const combinations: MentsuCombination[] = [];
    
    // 通常手の解析
    const regularCombinations = this.findRegularCombinations(tiles, options.winningTile);
    combinations.push(...regularCombinations);
    
    // 七対子の解析
    const chitoitsuCombination = this.findChitoitsuCombination(tiles);
    if (chitoitsuCombination) {
      combinations.push(chitoitsuCombination);
    }
    
    // 国士無双の解析
    const kokushiCombination = this.findKokushiCombination(tiles);
    if (kokushiCombination) {
      combinations.push(kokushiCombination);
    }

    return combinations;
  }

  // 通常手（4面子1雀頭）の組み合わせを取得
  private findRegularCombinations(tiles: Tile[], winningTile?: Tile): MentsuCombination[] {
    const combinations: MentsuCombination[] = [];
    const sortedTiles = [...tiles].sort(Tile.compare);

    // 全ての対子の位置を試す
    for (let i = 0; i < sortedTiles.length - 1; i++) {
      if (sortedTiles[i].equalsIgnoreRed(sortedTiles[i + 1])) {
        const pair = Mentsu.createPair([sortedTiles[i], sortedTiles[i + 1]]);
        const remainingTiles = [...sortedTiles];
        remainingTiles.splice(i, 2);

        const meldCombinations = this.findMentsusRecursively(remainingTiles, []);
        
        for (const melds of meldCombinations) {
          if (melds.length === 4) {
            const waitType = this.determineWaitType(tiles, melds, pair, winningTile);
            combinations.push({
              melds,
              pair,
              waitType
            });
          }
        }
      }
    }

    return combinations;
  }

  // 再帰的に面子を探す
  private findMentsusRecursively(tiles: Tile[], currentMentsus: Mentsu[]): Mentsu[][] {
    if (tiles.length === 0) {
      return [currentMentsus];
    }

    if (tiles.length % 3 !== 0) {
      return []; // 3の倍数でない場合は面子を作れない
    }

    const results: Mentsu[][] = [];
    const firstTile = tiles[0];

    // 刻子を試す
    const tripletIndices = this.findTripletIndices(tiles, firstTile);
    if (tripletIndices.length >= 3) {
      const tripletTiles = tripletIndices.slice(0, 3).map(i => tiles[i]);
      const triplet = Mentsu.createTriplet([tripletTiles[0], tripletTiles[1], tripletTiles[2]]);
      const remainingTiles = this.removeTilesAtIndices(tiles, tripletIndices.slice(0, 3));
      
      const subResults = this.findMentsusRecursively(remainingTiles, [...currentMentsus, triplet]);
      results.push(...subResults);
    }

    // 順子を試す（数牌のみ）
    if (!firstTile.isHonor()) {
      const sequenceResult = this.tryCreateSequence(tiles, firstTile);
      if (sequenceResult) {
        const { sequence, remainingTiles } = sequenceResult;
        const subResults = this.findMentsusRecursively(remainingTiles, [...currentMentsus, sequence]);
        results.push(...subResults);
      }
    }

    return results;
  }

  private findTripletIndices(tiles: Tile[], targetTile: Tile): number[] {
    const indices: number[] = [];
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].equalsIgnoreRed(targetTile)) {
        indices.push(i);
      }
    }
    return indices;
  }

  private tryCreateSequence(tiles: Tile[], firstTile: Tile): { sequence: Mentsu, remainingTiles: Tile[] } | null {
    if (firstTile.isHonor() || firstTile.value > 7) {
      return null;
    }

    const secondTile = tiles.find(t => t.suit === firstTile.suit && t.value === firstTile.value + 1);
    const thirdTile = tiles.find(t => t.suit === firstTile.suit && t.value === firstTile.value + 2);

    if (!secondTile || !thirdTile) {
      return null;
    }

    const sequence = Mentsu.createSequence([firstTile, secondTile, thirdTile]);
    const remainingTiles = [...tiles];
    
    // 使用した牌を削除
    const firstIndex = remainingTiles.findIndex(t => t.equals(firstTile));
    remainingTiles.splice(firstIndex, 1);
    const secondIndex = remainingTiles.findIndex(t => t.equals(secondTile));
    remainingTiles.splice(secondIndex, 1);
    const thirdIndex = remainingTiles.findIndex(t => t.equals(thirdTile));
    remainingTiles.splice(thirdIndex, 1);

    return { sequence, remainingTiles };
  }

  private removeTilesAtIndices(tiles: Tile[], indices: number[]): Tile[] {
    const result = [...tiles];
    // 逆順で削除（インデックスがずれないように）
    for (let i = indices.length - 1; i >= 0; i--) {
      result.splice(indices[i], 1);
    }
    return result;
  }

  // 七対子の組み合わせを取得
  private findChitoitsuCombination(tiles: Tile[]): MentsuCombination | null {
    const pairs: Mentsu[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < tiles.length - 1; i++) {
      if (usedIndices.has(i)) continue;
      
      for (let j = i + 1; j < tiles.length; j++) {
        if (usedIndices.has(j)) continue;
        
        if (tiles[i].equalsIgnoreRed(tiles[j])) {
          pairs.push(Mentsu.createPair([tiles[i], tiles[j]]));
          usedIndices.add(i);
          usedIndices.add(j);
          break;
        }
      }
    }

    if (pairs.length === 7) {
      return {
        melds: pairs.slice(0, 6),
        pair: pairs[6],
        waitType: 'tanki'
      };
    }

    return null;
  }

  // 国士無双の組み合わせを取得
  private findKokushiCombination(tiles: Tile[]): MentsuCombination | null {

    const terminalCounts = new Map<string, number>();
    let pairTile: Tile | null = null;

    for (const tile of tiles) {
      if (!tile.isTerminal()) {
        return null; // 国士無双は幺九牌のみ
      }

      const key = `${tile.suit}-${tile.value}`;
      const count = (terminalCounts.get(key) || 0) + 1;
      terminalCounts.set(key, count);

      if (count === 2) {
        if (pairTile) {
          return null; // 対子が2つある
        }
        pairTile = tile;
      } else if (count > 2) {
        return null; // 3枚以上ある
      }
    }

    if (terminalCounts.size === 13 && pairTile) {
      const pair = Mentsu.createPair([pairTile, pairTile]);
      return {
        melds: [], // 国士無双は面子なし
        pair,
        waitType: 'tanki'
      };
    }

    return null;
  }

  // 待ちの形を判定
  private determineWaitType(_allTiles: Tile[], melds: Mentsu[], pair: Mentsu, winningTile?: Tile): WaitType {
    if (!winningTile) {
      // 和了牌が不明な場合はデフォルト値を返す
      return 'ryanmen';
    }
    
    // 単騎待ち：雀頭が和了牌
    if (pair.tiles.some(tile => tile.equalsIgnoreRed(winningTile))) {
      return 'tanki';
    }
    
    // 面子の中で和了牌を探す
    for (const meld of melds) {
      if (meld.type === 'sequence') {
        const tiles = meld.tiles.sort((a, b) => a.value - b.value);
        const winIndex = tiles.findIndex(tile => tile.equalsIgnoreRed(winningTile));
        
        if (winIndex !== -1) {
          // 順子の中の和了牌の位置で待ちを判定
          if (winIndex === 0 && tiles[0].value === 7) {
            return 'penchan'; // 辺張（7,8,9の7待ち）
          } else if (winIndex === 2 && tiles[2].value === 3) {
            return 'penchan'; // 辺張（1,2,3の3待ち）
          } else if (winIndex === 1) {
            return 'kanchan'; // 嵌張（真ん中の牌）
          } else {
            return 'ryanmen'; // 両面
          }
        }
      } else if (meld.type === 'triplet') {
        // 刻子の場合はシャンポン待ち
        if (meld.tiles.some(tile => tile.equalsIgnoreRed(winningTile))) {
          return 'shanpon';
        }
      }
    }
    
    // デフォルトは両面待ち
    return 'ryanmen';
  }

  // 手牌が和了形かチェック
  public isWinningHand(tiles: Tile[]): boolean {
    return this.findAllMentsuCombinations(tiles).length > 0;
  }
}
// シャンテン数計算クラス

import { Tile } from '../common/tile';
import { HandType } from '../common/types';

export interface ShantenResult {
  readonly regularShanten: number;
  readonly chitoitsuShanten: number;
  readonly kokushiShanten: number;
  readonly minimumShanten: number;
  readonly bestHandType: HandType;
  readonly usefulTiles: Tile[];
}

export class ShantenCalculator {

  public calculateMinimumShanten(tiles: Tile[]): ShantenResult {
    if (tiles.length !== 13 && tiles.length !== 14) {
      throw new Error('Hand must have 13 or 14 tiles for shanten calculation');
    }

    const regularShanten = this.calculateRegularShanten(tiles);
    const chitoitsuShanten = this.calculateChitoitsuShanten(tiles);
    const kokushiShanten = this.calculateKokushiShanten(tiles);

    const minimumShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
    
    let bestHandType: HandType;
    if (minimumShanten === regularShanten) {
      bestHandType = HandType.REGULAR;
    } else if (minimumShanten === chitoitsuShanten) {
      bestHandType = HandType.CHITOITSU;
    } else {
      bestHandType = HandType.KOKUSHI;
    }

    const usefulTiles = this.calculateUsefulTiles(tiles, bestHandType);

    return {
      regularShanten,
      chitoitsuShanten,
      kokushiShanten,
      minimumShanten,
      bestHandType,
      usefulTiles
    };
  }

  public calculateRegularShanten(tiles: Tile[]): number {
    const tileCounts = this.countTiles(tiles);
    return this.calculateRegularShantenFromCounts(tileCounts);
  }

  private calculateRegularShantenFromCounts(tileCounts: Map<string, number>): number {
    let minShanten = 8;
    
    // 全ての対子候補を試す
    for (const [tileKey, count] of tileCounts) {
      if (count >= 2) {
        // この牌を雀頭とする
        const modifiedCounts = new Map(tileCounts);
        modifiedCounts.set(tileKey, count - 2);
        
        const { mentsuCount, tatsuCount } = this.analyzeMentsu(modifiedCounts);
        const shanten = 8 - mentsuCount * 2 - tatsuCount;
        minShanten = Math.min(minShanten, shanten);
      }
    }
    
    return minShanten;
  }

  private analyzeMentsu(tileCounts: Map<string, number>): { mentsuCount: number, tatsuCount: number } {
    let mentsuCount = 0;
    let tatsuCount = 0;
    const counts = new Map(tileCounts);

    // 刻子を除去
    for (const [_tileKey, count] of counts) {
      if (count >= 3) {
        const tripletCount = Math.floor(count / 3);
        mentsuCount += tripletCount;
        counts.set(_tileKey, count - tripletCount * 3);
      }
    }

    // 順子を除去（数牌のみ）
    this.removeSequences(counts);
    mentsuCount += this.sequenceCount;

    // 塔子をカウント
    tatsuCount = this.countTatsu(counts);

    return { mentsuCount, tatsuCount };
  }

  private sequenceCount = 0;

  private removeSequences(counts: Map<string, number>): void {
    this.sequenceCount = 0;
    
    for (const suit of ['man', 'pin', 'sou']) {
      for (let value = 1; value <= 7; value++) {
        const key1 = `${suit}-${value}`;
        const key2 = `${suit}-${value + 1}`;
        const key3 = `${suit}-${value + 2}`;
        
        const count1 = counts.get(key1) || 0;
        const count2 = counts.get(key2) || 0;
        const count3 = counts.get(key3) || 0;
        
        const sequenceCount = Math.min(count1, count2, count3);
        if (sequenceCount > 0) {
          this.sequenceCount += sequenceCount;
          counts.set(key1, count1 - sequenceCount);
          counts.set(key2, count2 - sequenceCount);
          counts.set(key3, count3 - sequenceCount);
        }
      }
    }
  }

  private countTatsu(counts: Map<string, number>): number {
    let tatsuCount = 0;

    // 対子をカウント
    for (const [_tileKey, count] of counts) {
      if (count >= 2) {
        tatsuCount += Math.floor(count / 2);
      }
    }

    // 両面・嵌張塔子をカウント（数牌のみ）
    for (const suit of ['man', 'pin', 'sou']) {
      for (let value = 1; value <= 8; value++) {
        const key1 = `${suit}-${value}`;
        const key2 = `${suit}-${value + 1}`;
        
        const count1 = counts.get(key1) || 0;
        const count2 = counts.get(key2) || 0;
        
        if (count1 > 0 && count2 > 0) {
          const tatsuCountForThisPair = Math.min(count1, count2);
          tatsuCount += tatsuCountForThisPair;
          counts.set(key1, count1 - tatsuCountForThisPair);
          counts.set(key2, count2 - tatsuCountForThisPair);
        }
      }
    }

    return Math.min(tatsuCount, 4); // 最大4つまで
  }

  public calculateChitoitsuShanten(tiles: Tile[]): number {
    const tileCounts = this.countTiles(tiles);
    let pairCount = 0;
    let uniqueCount = 0;

    for (const [_tileKey, count] of tileCounts) {
      if (count >= 2) {
        pairCount += Math.floor(count / 2);
      }
      if (count > 0) {
        uniqueCount++;
      }
    }

    // 七対子のシャンテン数計算
    const shanten = 6 - pairCount + Math.max(0, 7 - uniqueCount);
    return Math.max(0, shanten);
  }

  public calculateKokushiShanten(tiles: Tile[]): number {
    const terminalTypes = [
      'man-1', 'man-9', 'pin-1', 'pin-9', 'sou-1', 'sou-9',
      'wind-1', 'wind-2', 'wind-3', 'wind-4',
      'dragon-1', 'dragon-2', 'dragon-3'
    ];

    const tileCounts = this.countTiles(tiles);
    let terminalKindCount = 0;
    let hasPair = false;

    for (const terminalType of terminalTypes) {
      const count = tileCounts.get(terminalType) || 0;
      if (count > 0) {
        terminalKindCount++;
        if (count >= 2 && !hasPair) {
          hasPair = true;
        }
      }
    }

    // 非終端牌がある場合は国士無双不可能
    for (const [tileKey, count] of tileCounts) {
      if (count > 0 && !terminalTypes.includes(tileKey)) {
        return 13; // 最大シャンテン数
      }
    }

    const shanten = 13 - terminalKindCount - (hasPair ? 1 : 0);
    return Math.max(0, shanten);
  }

  private countTiles(tiles: Tile[]): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const tile of tiles) {
      const key = `${tile.suit}-${tile.value}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    
    return counts;
  }

  private calculateUsefulTiles(tiles: Tile[], handType: HandType): Tile[] {
    // 簡略化された有効牌計算
    // 実際の実装では各牌を追加してシャンテン数が減るかチェック
    const usefulTiles: Tile[] = [];
    
    if (handType === 'kokushi') {
      // 国士無双の有効牌は幺九牌
      const terminalTiles = [
        new Tile('man', 1), new Tile('man', 9),
        new Tile('pin', 1), new Tile('pin', 9),
        new Tile('sou', 1), new Tile('sou', 9),
        new Tile('wind', 1), new Tile('wind', 2),
        new Tile('wind', 3), new Tile('wind', 4),
        new Tile('dragon', 1), new Tile('dragon', 2),
        new Tile('dragon', 3)
      ];
      
      const tileCounts = this.countTiles(tiles);
      for (const tile of terminalTiles) {
        const key = `${tile.suit}-${tile.value}`;
        if ((tileCounts.get(key) || 0) === 0) {
          usefulTiles.push(tile);
        }
      }
    } else {
      // 通常手・七対子の有効牌計算は複雑なため省略
      // 実装では全ての牌を試してシャンテン数が減るものを抽出
    }
    
    return usefulTiles;
  }

  public isComplete(tiles: Tile[]): boolean {
    return this.calculateMinimumShanten(tiles).minimumShanten === -1;
  }

  public isTenpai(tiles: Tile[]): boolean {
    return this.calculateMinimumShanten(tiles).minimumShanten === 0;
  }

  public createShantenResult(
    regular: number, 
    chitoitsu: number, 
    kokushi: number, 
    usefulTiles: Tile[] = []
  ): ShantenResult {
    const minimumShanten = Math.min(regular, chitoitsu, kokushi);
    
    let bestHandType: HandType;
    if (minimumShanten === regular) {
      bestHandType = 'regular';
    } else if (minimumShanten === chitoitsu) {
      bestHandType = 'chitoitsu';
    } else {
      bestHandType = 'kokushi';
    }

    return {
      regularShanten: regular,
      chitoitsuShanten: chitoitsu,
      kokushiShanten: kokushi,
      minimumShanten,
      bestHandType,
      usefulTiles
    };
  }
}
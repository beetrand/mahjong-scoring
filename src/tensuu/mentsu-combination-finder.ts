// 面子組み合わせ計算クラス

import { Tile } from '../common/tile';
import { Mentsu } from '../common/mentsu';
import { WaitType, MentsuType } from '../common/types';

export interface MentsuCombination {
  melds: Mentsu[];
  pair: Mentsu;
  waitType: WaitType;
}

/**
 * 面子組み合わせ計算クラス
 * 和了形の面子組み合わせ探索を担当
 */
export class MentsuCombinationFinder {

  /**
   * 全ての面子組み合わせを探索
   */
  public findAllCombinations(tiles: Tile[]): MentsuCombination[] {
    if (tiles.length !== 14) {
      return [];
    }

    // 簡易実装：基本的な組み合わせのみ
    // より詳細な実装は今後追加予定
    const combinations: MentsuCombination[] = [];
    
    // 七対子の判定
    const chitoitsuCombination = this.tryChitoitsu(tiles);
    if (chitoitsuCombination) {
      combinations.push(chitoitsuCombination);
    }

    // 国士無双の判定
    const kokushiCombination = this.tryKokushi(tiles);
    if (kokushiCombination) {
      combinations.push(kokushiCombination);
    }

    // 通常手の判定
    const regularCombinations = this.tryRegularHand(tiles);
    combinations.push(...regularCombinations);

    return combinations;
  }

  /**
   * 最適な面子組み合わせを探索
   */
  public findBestCombination(tiles: Tile[]): MentsuCombination | null {
    const combinations = this.findAllCombinations(tiles);
    
    if (combinations.length === 0) {
      return null;
    }

    // 簡易実装：最初の組み合わせを返す
    // より詳細な評価は今後追加予定
    return combinations[0];
  }

  /**
   * 面子組み合わせの数を取得（軽量版）
   */
  public countCombinations(tiles: Tile[]): number {
    return this.findAllCombinations(tiles).length;
  }

  /**
   * 七対子の面子組み合わせを試行
   */
  private tryChitoitsu(tiles: Tile[]): MentsuCombination | null {
    const tileCount = new Map<string, number>();
    tiles.forEach(tile => {
      const key = tile.toString();
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    });

    // 7種類の対子が必要
    const pairs: Mentsu[] = [];
    for (const [tileStr, count] of tileCount.entries()) {
      if (count === 2) {
        const tile = this.parseTileString(tileStr);
        if (tile) {
          pairs.push(new Mentsu([tile, tile], MentsuType.PAIR));
        }
      } else if (count !== 0) {
        return null; // 対子以外があるので七対子ではない
      }
    }

    if (pairs.length === 7) {
      return {
        melds: pairs.slice(0, 6), // 6つの面子として扱う
        pair: pairs[6], // 最後の1つを雀頭として扱う
        waitType: WaitType.TANKI
      };
    }

    return null;
  }

  /**
   * 国士無双の面子組み合わせを試行
   */
  private tryKokushi(tiles: Tile[]): MentsuCombination | null {
    const terminals = this.getTerminalTiles();
    const tileCount = new Map<string, number>();
    
    tiles.forEach(tile => {
      const key = tile.toString();
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    });

    // 13種類の字牌・端牌が必要
    const singles: Mentsu[] = [];
    let pair: Mentsu | null = null;

    for (const terminal of terminals) {
      const count = tileCount.get(terminal) || 0;
      if (count === 1) {
        const tile = this.parseTileString(terminal);
        if (tile) {
          singles.push(new Mentsu([tile], MentsuType.PAIR)); // 簡易実装として PAIR を使用
        }
      } else if (count === 2) {
        const tile = this.parseTileString(terminal);
        if (tile && !pair) {
          pair = new Mentsu([tile, tile], MentsuType.PAIR);
        }
      } else if (count !== 0) {
        return null; // 不正な枚数
      }
    }

    if (singles.length === 12 && pair) {
      return {
        melds: singles.slice(0, 4), // 4つの面子として扱う（簡易）
        pair: pair,
        waitType: WaitType.TANKI
      };
    }

    return null;
  }

  /**
   * 通常手の面子組み合わせを試行
   */
  private tryRegularHand(tiles: Tile[]): MentsuCombination[] {
    // 簡易実装：基本的な組み合わせのみ
    // より詳細な実装は今後追加予定
    const combinations: MentsuCombination[] = [];
    
    // 刻子優先の組み合わせを試行
    const tripletCombination = this.tryTripletFirst(tiles);
    if (tripletCombination) {
      combinations.push(tripletCombination);
    }

    return combinations;
  }

  /**
   * 刻子優先の組み合わせを試行
   */
  private tryTripletFirst(tiles: Tile[]): MentsuCombination | null {
    const tileCount = new Map<string, number>();
    tiles.forEach(tile => {
      const key = tile.toString();
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    });

    const melds: Mentsu[] = [];
    let pair: Mentsu | null = null;

    // 刻子を探す
    for (const [tileStr, count] of tileCount.entries()) {
      if (count >= 3) {
        const tile = this.parseTileString(tileStr);
        if (tile) {
          melds.push(new Mentsu([tile, tile, tile], MentsuType.TRIPLET));
          tileCount.set(tileStr, count - 3);
        }
      }
    }

    // 対子を探す
    for (const [tileStr, count] of tileCount.entries()) {
      if (count >= 2 && !pair) {
        const tile = this.parseTileString(tileStr);
        if (tile) {
          pair = new Mentsu([tile, tile], MentsuType.PAIR);
          tileCount.set(tileStr, count - 2);
        }
      }
    }

    // 簡易実装：4面子1雀頭の判定は省略
    // 実際の実装では順子の判定も必要
    
    if (melds.length >= 1 && pair) {
      return {
        melds: melds,
        pair: pair,
        waitType: WaitType.TANKI // 簡易実装
      };
    }

    return null;
  }

  /**
   * 国士無双用の字牌・端牌リストを取得
   */
  private getTerminalTiles(): string[] {
    return [
      '1m', '9m', '1p', '9p', '1s', '9s', // 端牌
      '1z', '2z', '3z', '4z', '5z', '6z', '7z' // 字牌
    ];
  }

  /**
   * 文字列から牌オブジェクトを作成
   */
  private parseTileString(tileStr: string): Tile | null {
    try {
      return Tile.fromString(tileStr);
    } catch {
      return null;
    }
  }
}
// 役判定システム

import { Tile } from '../common/tile';
import type { ComponentCombination } from '../common/component';
import { Component } from '../common/component';
import type { YakuContext } from '../common/types';

export interface YakuResult {
  readonly name: string;
  readonly hanValue: number;
  readonly isYakuman: boolean;
  readonly isSuppressed: boolean;
}

export abstract class Yaku {
  public abstract readonly name: string;
  public abstract readonly hanValue: number;
  public abstract readonly isYakuman: boolean;

  public abstract isApplicable(combination: ComponentCombination, context: YakuContext): boolean;
  
  public suppressedBy(): string[] {
    return [];
  }

  public getHanValue(_context?: YakuContext): number {
    return this.hanValue;
  }
}

// 1翻役
export class RiichiYaku extends Yaku {
  public readonly name = 'リーチ';
  public readonly hanValue = 1;
  public readonly isYakuman = false;

  public isApplicable(_combination: ComponentCombination, context: YakuContext): boolean {
    return context.isRiichi;
  }
}

export class TsumoYaku extends Yaku {
  public readonly name = 'ツモ';
  public readonly hanValue = 1;
  public readonly isYakuman = false;

  public isApplicable(_combination: ComponentCombination, context: YakuContext): boolean {
    return context.isTsumo && context.isOpenHand === false;
  }
}

export class PinfuYaku extends Yaku {
  public readonly name = '平和';
  public readonly hanValue = 1;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, context: YakuContext): boolean {
    if (context.isOpenHand) return false;
    
    // 4面子が全て順子
    if (combination.melds.some(meld => meld.type !== 'sequence')) {
      return false;
    }

    // 雀頭が役牌でない
    if (combination.pair.isValuePair()) {
      return false;
    }

    // 両面待ち（簡略判定）
    return combination.waitType === 'ryanmen' as any;
  }
}

export class TanyaoYaku extends Yaku {
  public readonly name = '断幺九';
  public readonly hanValue = 1;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    const allTiles = [
      ...combination.melds.flatMap((meld: Component) => meld.tiles),
      ...combination.pair.tiles
    ];

    // 副露がある場合も適用可能（クイタン）
    return allTiles.every(tile => tile.isSimple());
  }
}

export class YakuhaiYaku extends Yaku {
  public readonly name = '役牌';
  public readonly hanValue = 1;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, context: YakuContext): boolean {
    return combination.melds.some(meld => 
      meld.type === 'triplet' && this.isYakuhaiTile(meld.getTileValue(), context)
    ) || combination.pair.isValuePair();
  }

  private isYakuhaiTile(tile: Tile, context: YakuContext): boolean {
    if (tile.isDragon()) return true;
    if (tile.isWind()) {
      return tile.value === context.gameContext.roundWind || 
             tile.value === context.gameContext.playerWind;
    }
    return false;
  }
}

// 2翻役
export class ChitoitsuYaku extends Yaku {
  public readonly name = '七対子';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    return combination.melds.length === 6 && 
           combination.melds.every((meld: Component) => meld.type === 'pair');
  }
}

export class IttsuYaku extends Yaku {
  public readonly name = '一気通貫';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    const sequences = combination.melds.filter((meld: Component) => meld.type === 'sequence');
    
    for (const suit of ['man', 'pin', 'sou'] as const) {
      const suitSequences = sequences.filter(seq => seq.getTileValue().suit === suit);
      
      const has123 = suitSequences.some(seq => seq.getTileValue().value === 1);
      const has456 = suitSequences.some(seq => seq.getTileValue().value === 4);
      const has789 = suitSequences.some(seq => seq.getTileValue().value === 7);
      
      if (has123 && has456 && has789) {
        return true;
      }
    }
    
    return false;
  }
  
  public getHanValue(context: YakuContext): number {
    // 副露がある場合は1翻（喰い下がり）
    return context.isOpenHand ? 1 : 2;
  }
}

// 副露関連の役
export class ToitoiYaku extends Yaku {
  public readonly name = '対々和';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    // 4つの面子が全て刻子または槓子
    const tripletOrQuads = combination.melds.filter((meld: Component) => 
      meld.type === 'triplet' || meld.type === 'quad'
    );
    
    return tripletOrQuads.length === 4;
  }
}

export class SanshokudoujunYaku extends Yaku {
  public readonly name = '三色同順';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    const sequences = combination.melds.filter((meld: Component) => meld.type === 'sequence');
    
    // 同じ数字の順子が3色にあるかチェック
    for (let value = 1; value <= 7; value++) {
      const suits = ['man', 'pin', 'sou'] as const;
      const foundSuits = suits.filter(suit => 
        sequences.some((seq: Component) => {
          const firstTile = seq.getTileValue();
          return firstTile.suit === suit && firstTile.value === value;
        })
      );
      
      if (foundSuits.length === 3) {
        return true;
      }
    }
    
    return false;
  }
  
  public getHanValue(context: YakuContext): number {
    // 副露がある場合は1翻（喰い下がり）
    return context.isOpenHand ? 1 : 2;
  }
}

export class SanshokudoukouYaku extends Yaku {
  public readonly name = '三色同刻';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    const triplets = combination.melds.filter((meld: Component) => 
      meld.type === 'triplet' || meld.type === 'quad'
    );
    
    // 同じ数字の刻子が3色にあるかチェック
    for (let value = 1; value <= 9; value++) {
      const suits = ['man', 'pin', 'sou'] as const;
      const foundSuits = suits.filter(suit => 
        triplets.some(triplet => {
          const tile = triplet.getTileValue();
          return tile.suit === suit && tile.value === value;
        })
      );
      
      if (foundSuits.length === 3) {
        return true;
      }
    }
    
    return false;
  }
}

export class HonroutouYaku extends Yaku {
  public readonly name = '混老頭';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    const allTiles = [
      ...combination.melds.flatMap((meld: Component) => meld.tiles),
      ...combination.pair.tiles
    ];

    // 全て刻子・槓子・対子（順子がない）
    const hasSequence = combination.melds.some(meld => meld.type === 'sequence');
    if (hasSequence) return false;

    // 全て幺九牌（1・9・字牌）
    return allTiles.every(tile => tile.isTerminal());
  }
}

export class SanankoYaku extends Yaku {
  public readonly name = '三暗刻';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    const concealedTriplets = combination.melds.filter((meld: Component) => 
      (meld.type === 'triplet' || meld.type === 'quad') && meld.isConcealed
    );
    
    return concealedTriplets.length === 3;
  }
}

// 役満
export class KokushimusouYaku extends Yaku {
  public readonly name = '国士無双';
  public readonly hanValue = 13;
  public readonly isYakuman = true;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    // 国士無双は特殊な形なので、combination.meldsが空
    if (combination.melds.length !== 0) return false;
    
    const allTiles = [...combination.pair.tiles];
    
    // 13種類の幺九牌 + 1枚の対子
    const terminalTypes = new Set();
    for (const tile of allTiles) {
      if (!tile.isTerminal()) return false;
      terminalTypes.add(`${tile.suit}-${tile.value}`);
    }
    
    return terminalTypes.size === 13;
  }
}

export class SuuankoYaku extends Yaku {
  public readonly name = '四暗刻';
  public readonly hanValue = 13;
  public readonly isYakuman = true;

  public isApplicable(combination: ComponentCombination, context: YakuContext): boolean {
    const concealedTriplets = combination.melds.filter((meld: Component) => 
      (meld.type === 'triplet' || meld.type === 'quad') && meld.isConcealed
    );
    
    return concealedTriplets.length === 4 && context.isTsumo;
  }
}

export class DaisangenYaku extends Yaku {
  public readonly name = '大三元';
  public readonly hanValue = 13;
  public readonly isYakuman = true;

  public isApplicable(combination: ComponentCombination, _context: YakuContext): boolean {
    const dragonTriplets = combination.melds.filter((meld: Component) => 
      (meld.type === 'triplet' || meld.type === 'quad') && 
      meld.getTileValue().isDragon()
    );
    
    const dragonValues = new Set(dragonTriplets.map(meld => meld.getTileValue().value));
    return dragonValues.size === 3; // 白發中の3種類
  }
}

// 役判定エンジン
export class YakuDetector {
  private yakuList: Yaku[];

  constructor() {
    this.yakuList = [
      new RiichiYaku(),
      new TsumoYaku(),
      new PinfuYaku(),
      new TanyaoYaku(),
      new YakuhaiYaku(),
      new ChitoitsuYaku(),
      new IttsuYaku(),
      new ToitoiYaku(),
      new SanshokudoujunYaku(),
      new SanshokudoukouYaku(),
      new HonroutouYaku(),
      new SanankoYaku(),
      new KokushimusouYaku(),
      new SuuankoYaku(),
      new DaisangenYaku(),
    ];
  }

  public detectYaku(combination: ComponentCombination, context: YakuContext): YakuResult[] {
    const results: YakuResult[] = [];
    
    for (const yaku of this.yakuList) {
      if (yaku.isApplicable(combination, context)) {
        // 喰い下がりを考慮した翻数を取得
        const hanValue = this.getAdjustedHanValue(yaku, context);
        
        results.push({
          name: yaku.name,
          hanValue: hanValue,
          isYakuman: yaku.isYakuman,
          isSuppressed: false
        });
      }
    }

    return this.applySuppression(results);
  }

  private getAdjustedHanValue(yaku: Yaku, context: YakuContext): number {
    // 喰い下がり対応の役かチェック
    if (yaku instanceof IttsuYaku || yaku instanceof SanshokudoujunYaku) {
      return context.isOpenHand ? yaku.hanValue - 1 : yaku.hanValue;
    }
    
    return yaku.hanValue;
  }

  public calculateTotalHan(yakuResults: YakuResult[]): number {
    const activeYaku = yakuResults.filter(result => !result.isSuppressed);
    
    // 役満がある場合は役満のみカウント
    const yakumanYaku = activeYaku.filter(result => result.isYakuman);
    if (yakumanYaku.length > 0) {
      return yakumanYaku.reduce((total, yaku) => total + yaku.hanValue, 0);
    }
    
    return activeYaku.reduce((total, yaku) => total + yaku.hanValue, 0);
  }

  private applySuppression(yakuResults: YakuResult[]): YakuResult[] {
    // 役の抑制関係を適用
    const results = [...yakuResults];
    
    // 平和とツモの複合は平和を優先（符計算に影響）
    const hasPinfu = results.some(r => r.name === '平和');
    const hasTsumo = results.some(r => r.name === 'ツモ');
    
    if (hasPinfu && hasTsumo) {
      const tsumoIndex = results.findIndex(r => r.name === 'ツモ');
      if (tsumoIndex >= 0) {
        results[tsumoIndex] = { ...results[tsumoIndex], isSuppressed: true };
      }
    }
    
    // 役満がある場合は通常役を抑制
    const hasYakuman = results.some(r => r.isYakuman);
    if (hasYakuman) {
      for (let i = 0; i < results.length; i++) {
        if (!results[i].isYakuman) {
          results[i] = { ...results[i], isSuppressed: true };
        }
      }
    }
    
    return results;
  }

  public addYaku(yaku: Yaku): void {
    this.yakuList.push(yaku);
  }
}
// 点数計算システム

import type { ComponentCombination } from '../common/component';
import { Component, ComponentType } from '../common/component';
import type { YakuResult } from './yaku';
import type { FuContext, BonusPoints } from '../common/types';

export interface FuResult {
  readonly totalFu: number;
  readonly breakdown: FuBreakdown;
}

export interface FuBreakdown {
  readonly baseFu: number;
  readonly meldsFu: number;
  readonly pairFu: number;
  readonly waitFu: number;
  readonly winningMethodFu: number;
  readonly concealedFu: number;
}

export interface ScoreResult {
  readonly basicPoints: number;
  readonly finalScore: number;
  readonly isLimitHand: boolean;
  readonly limitHandType?: LimitHandType;
}

export interface PaymentResult {
  readonly totalPayment: number;
  readonly dealerPayment?: number;
  readonly nonDealerPayment?: number;
  readonly bonusPayment: number;
}

export const LimitHandType = {
  MANGAN: 'mangan',
  HANEMAN: 'haneman',
  BAIMAN: 'baiman',
  SANBAIMAN: 'sanbaiman',
  YAKUMAN: 'yakuman'
} as const;
export type LimitHandType = typeof LimitHandType[keyof typeof LimitHandType];

export class FuCalculator {
  public calculateFu(combination: ComponentCombination, context: FuContext): FuResult {
    const baseFu = this.getBaseFu();
    
    // 面子と対子を分離
    const melds = combination.components.filter(c => c.isCompleteMentsu());
    const pair = combination.components.find(c => c.type === ComponentType.PAIR);
    
    if (!pair) {
      throw new Error('Pair not found in ComponentCombination');
    }
    
    const meldsFu = this.getComponentsFu(melds, context);
    const pairFu = this.getPairFu(pair, context);
    const waitFu = 0; // TODO: 待ちタイプは別途計算が必要
    const winningMethodFu = this.getWinningMethodFu(context);
    const concealedFu = this.getConcealedFu(context);

    const totalFu = baseFu + meldsFu + pairFu + waitFu + winningMethodFu + concealedFu;
    const roundedFu = this.roundUpToTen(totalFu);

    return {
      totalFu: roundedFu,
      breakdown: {
        baseFu,
        meldsFu,
        pairFu,
        waitFu,
        winningMethodFu,
        concealedFu
      }
    };
  }

  private getBaseFu(): number {
    return 20;
  }

  private getComponentsFu(melds: Component[], context: FuContext): number {
    return melds.reduce((total, meld) => total + this.getComponentFu(meld, context), 0);
  }

  private getPairFu(pair: Component, context: FuContext): number {
    return this.getComponentFu(pair, context);
  }

  /**
   * Componentの符を計算（Componentから移動）
   */
  private getComponentFu(component: Component, context: FuContext): number {
    if (!component.isMentsu()) {
      return 0; // 搭子・孤立牌は符なし
    }

    const tile = component.getTileValue();
    
    switch (component.type) {
      case 'sequence':
        return 0; // 順子は0符
        
      case 'triplet':
        if (tile.isTerminal() || tile.isHonor()) {
          return component.isConcealed ? 8 : 4;
        } else {
          return component.isConcealed ? 4 : 2;
        }
        
      case 'quad':
        if (tile.isTerminal() || tile.isHonor()) {
          return component.isConcealed ? 32 : 16;
        } else {
          return component.isConcealed ? 16 : 8;
        }
        
      case 'pair':
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

  // TODO: 待ちタイプ判定が必要な場合は別途実装
  // private getWaitFu(waitType: WaitType): number { ... }

  private getWinningMethodFu(context: FuContext): number {
    if (context.isTsumo) {
      return 2; // ツモボーナス
    } else if (!context.isOpenHand) {
      return 10; // 門前ロンボーナス（門前清栄和）
    }
    return 0;
  }

  private getConcealedFu(_context: FuContext): number {
    // 門前清栄和は getWinningMethodFu で処理するため、ここでは0
    return 0;
  }

  private roundUpToTen(fu: number): number {
    return Math.ceil(fu / 10) * 10;
  }
}

export class ScoreCalculator {
  public calculateScore(han: number, fu: number, isDealer: boolean): ScoreResult {
    // 役満チェック
    if (han >= 13) {
      return this.createYakumanScore(han, isDealer);
    }

    // 役なしチェック
    if (han === 0) {
      throw new Error('No yaku - cannot calculate score');
    }

    // 基本点数計算
    const basicPoints = this.getBasicPoints(han, fu);
    
    // 満貫以上チェック
    const limitHand = this.checkLimitHand(han, fu);
    if (limitHand) {
      return this.createLimitHandScore(limitHand, isDealer);
    }

    // 通常計算
    const multiplier = isDealer ? 6 : 4;
    const finalScore = this.roundUpToNearestHundred(basicPoints * multiplier);

    return {
      basicPoints,
      finalScore,
      isLimitHand: false
    };
  }

  private getBasicPoints(han: number, fu: number): number {
    return fu * Math.pow(2, han + 2);
  }

  private checkLimitHand(han: number, fu: number): LimitHandType | null {
    // 満貫以上の判定
    if (han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
      if (han >= 11) return 'sanbaiman';
      if (han >= 8) return 'baiman';
      if (han >= 6) return 'haneman';
      return 'mangan';
    }
    return null;
  }

  private createLimitHandScore(limitType: LimitHandType, isDealer: boolean): ScoreResult {
    const scores = {
      'mangan': isDealer ? 12000 : 8000,
      'haneman': isDealer ? 18000 : 12000,
      'baiman': isDealer ? 24000 : 16000,
      'sanbaiman': isDealer ? 36000 : 24000,
      'yakuman': isDealer ? 48000 : 32000
    };

    return {
      basicPoints: 0,
      finalScore: scores[limitType],
      isLimitHand: true,
      limitHandType: limitType
    };
  }

  private createYakumanScore(han: number, isDealer: boolean): ScoreResult {
    const yakumanCount = Math.floor(han / 13);
    const baseScore = isDealer ? 48000 : 32000;
    
    return {
      basicPoints: 0,
      finalScore: baseScore * yakumanCount,
      isLimitHand: true,
      limitHandType: 'yakuman'
    };
  }

  private roundUpToNearestHundred(points: number): number {
    return Math.ceil(points / 100) * 100;
  }
}

export class PaymentCalculator {
  public calculatePayments(
    score: ScoreResult,
    isTsumo: boolean,
    isDealer: boolean,
    bonuses: BonusPoints
  ): PaymentResult {
    const bonusPayment = bonuses.riichiSticks * 1000 + bonuses.honbaSticks * 300;

    if (isTsumo) {
      return this.calculateTsumoPayments(score, isDealer, bonusPayment);
    } else {
      return this.calculateRonPayments(score, bonusPayment);
    }
  }

  private calculateTsumoPayments(
    score: ScoreResult,
    isDealer: boolean,
    bonusPayment: number
  ): PaymentResult {
    if (isDealer) {
      // 親のツモ：子が均等に支払い
      const perPlayerPayment = Math.ceil(score.finalScore / 3 / 100) * 100;
      return {
        totalPayment: score.finalScore + bonusPayment,
        nonDealerPayment: perPlayerPayment,
        bonusPayment
      };
    } else {
      // 子のツモ：親が半分、他の子が1/4ずつ
      const dealerPayment = Math.ceil(score.finalScore / 2 / 100) * 100;
      const nonDealerPayment = Math.ceil(score.finalScore / 4 / 100) * 100;
      
      return {
        totalPayment: score.finalScore + bonusPayment,
        dealerPayment,
        nonDealerPayment,
        bonusPayment
      };
    }
  }

  private calculateRonPayments(
    score: ScoreResult,
    bonusPayment: number
  ): PaymentResult {
    // ロンの場合：放銃者が全額支払い
    return {
      totalPayment: score.finalScore + bonusPayment,
      bonusPayment
    };
  }
}

// 最終結果クラス
export class ScoringResult {
  public readonly handCombinations: ComponentCombination[];
  public readonly bestCombination: ComponentCombination;
  public readonly yakuResults: YakuResult[];
  public readonly fuResult: FuResult;
  public readonly scoreResult: ScoreResult;
  public readonly paymentResult: PaymentResult;

  constructor(
    handCombinations: ComponentCombination[],
    bestCombination: ComponentCombination,
    yakuResults: YakuResult[],
    fuResult: FuResult,
    scoreResult: ScoreResult,
    paymentResult: PaymentResult
  ) {
    this.handCombinations = handCombinations;
    this.bestCombination = bestCombination;
    this.yakuResults = yakuResults;
    this.fuResult = fuResult;
    this.scoreResult = scoreResult;
    this.paymentResult = paymentResult;
  }

  public getTotalHan(): number {
    return this.yakuResults
      .filter(yaku => !yaku.isSuppressed)
      .reduce((total, yaku) => total + yaku.hanValue, 0);
  }

  public getTotalFu(): number {
    return this.fuResult.totalFu;
  }

  public getFinalScore(): number {
    return this.scoreResult.finalScore;
  }

  public getDisplayString(): string {
    const activeYaku = this.yakuResults.filter(yaku => !yaku.isSuppressed);
    const yakuNames = activeYaku.map(yaku => yaku.name).join('・');
    const han = this.getTotalHan();
    const fu = this.getTotalFu();
    const score = this.getFinalScore();

    if (this.scoreResult.limitHandType) {
      return `${yakuNames} ${han}翻 ${this.scoreResult.limitHandType} ${score}点`;
    } else {
      return `${yakuNames} ${han}翻${fu}符 ${score}点`;
    }
  }

  public static create(
    handCombinations: ComponentCombination[],
    bestCombination: ComponentCombination,
    yakuResults: YakuResult[],
    fuResult: FuResult,
    scoreResult: ScoreResult,
    paymentResult: PaymentResult
  ): ScoringResult {
    return new ScoringResult(
      handCombinations,
      bestCombination,
      yakuResults,
      fuResult,
      scoreResult,
      paymentResult
    );
  }
}
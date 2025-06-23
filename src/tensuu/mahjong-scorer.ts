// 麻雀点数計算統合クラス

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { ScoringResult } from './scoring';
import { ShantenCalculator } from './shanten-calculator';
import type { ShantenResult } from './shanten-calculator';
import type { GameContext, BonusPoints, OpenMeld, HandAnalysisResult, HandState } from '../common/types';

export class MahjongScorer {
  private shantenCalculator: ShantenCalculator;

  constructor() {
    this.shantenCalculator = new ShantenCalculator();
  }

  public scoreHand(_hand: Hand, _bonuses: BonusPoints = { riichiSticks: 0, honbaSticks: 0 }): ScoringResult {
    throw new Error('MentsuCombination-based scoring is not implemented. Use ShantenCalculator for analysis only.');
  }


  /**
   * 手牌オブジェクトのシャンテン数を計算（副露対応）
   */
  public calculateShanten(hand: Hand): ShantenResult {
    return this.shantenCalculator.calculateShanten(hand);
  }

  /**
   * 手牌オブジェクトが和了形かチェック（副露対応）
   */
  public isWinningHand(hand: Hand): boolean {
    const shantenResult = this.shantenCalculator.calculateShanten(hand);
    return shantenResult.shanten === -1;
  }

  /**
   * 手牌オブジェクトの状態を分析（副露対応）
   * 副露を適切に考慮したシャンテン計算
   */
  public analyzeHandState(hand: Hand): HandAnalysisResult {
    const shantenResult = this.shantenCalculator.calculateShanten(hand);
    const shanten = shantenResult.shanten;
    
    // 手牌状態の判定（統一されたロジック）
    let handState: HandState;
    let message: string;
    
    if (shanten === -1) {
      handState = 'winning';
      message = '上がり';
    } else if (shanten === 0) {
      handState = 'tenpai';
      message = 'テンパイ';
    } else {
      handState = 'incomplete';
      message = `${shanten}シャンテン`;
    }

    // 有効牌を文字列に変換
    const usefulTiles = shantenResult.usefulTiles?.map(tile => tile.toString()) || [];
    
    // 有効牌の残り枚数を計算
    const usefulTileCount = shantenResult.usefulTiles ? this.calculateRemainingTileCountFromHand(shantenResult.usefulTiles, hand) : 0;

    return {
      handState,
      shanten,
      bestHandType: shantenResult.handType,
      usefulTiles,
      usefulTileCount,
      message
    };
  }


  /**
   * 手牌オブジェクトから有効牌の残り枚数を計算
   */
  private calculateRemainingTileCountFromHand(usefulTiles: Tile[], hand: Hand): number {
    let remainingCount = 0;
    const allTiles = hand.getAllTiles(); // 副露牌も含む全牌
    
    // 各有効牌について、残り枚数を計算
    for (const usefulTile of usefulTiles) {
      const usedCount = allTiles.filter(tile => tile.equals(usefulTile)).length;
      const maxCount = 4; // 各牌種は最大4枚
      const remaining = maxCount - usedCount;
      remainingCount += Math.max(0, remaining);
    }
    
    return remainingCount;
  }



  /**
   * 文字列から手牌の状態を分析
   * @param tilesStr 手牌文字列
   * @param drawnTile ツモ牌（和了時は和了牌、非和了時も意味を持つ）
   * @returns 手牌分析結果
   */
  public analyzeHandStateFromString(tilesStr: string, drawnTile: string, gameContext: GameContext): HandAnalysisResult {
    const hand = Hand.fromString(tilesStr, {
      drawnTile,
      isTsumo: true,
      gameContext
    });
    return this.analyzeHandState(hand);
  }

  /**
   * 手牌を包括的に評価（シャンテン数に応じて適切な情報を返す）
   * @param tilesStr 手牌文字列
   * @param winningTile 自摸牌または和了牌（任意）
   * @param gameContext ゲーム状況
   * @param options 追加オプション
   * @returns 評価結果（状態に応じて異なる情報）
   */
  public evaluateHand(
    tilesStr: string,
    drawnTile?: string,
    gameContext?: GameContext,
    options: {
      isTsumo?: boolean;
      isRiichi?: boolean;
      openMelds?: OpenMeld[];
      bonuses?: BonusPoints;
    } = {}
  ): {
    analysis: HandAnalysisResult;
    scoring?: ScoringResult;
    recommendations: string[];
  } {
    if (!drawnTile || !gameContext) {
      throw new Error('drawnTile and gameContext are required');
    }
    
    const hand = Hand.fromString(tilesStr, {
      drawnTile,
      isTsumo: options.isTsumo || false,
      gameContext,
      isRiichi: options.isRiichi,
      openMelds: options.openMelds
    });
    const analysis = this.analyzeHandState(hand);
    
    let scoring: ScoringResult | undefined;
    const recommendations: string[] = [];

    // 手牌状態に応じた処理
    switch (analysis.handState) {
      case 'winning':
        // 上がりの場合：点数計算を実行
        if (gameContext && drawnTile) {
          try {
            scoring = this.scoreHandFromString(
              tilesStr,
              drawnTile,
              options.isTsumo || false,
              gameContext,
              {
                isRiichi: options.isRiichi,
                openMelds: options.openMelds,
                bonuses: options.bonuses
              }
            );
            recommendations.push(`和了！ ${scoring.getDisplayString()}`);
          } catch (error) {
            recommendations.push(`和了形ですが点数計算でエラー: ${error instanceof Error ? error.message : error}`);
          }
        } else {
          recommendations.push('和了形です。ゲーム状況とツモ牌を指定すると点数を計算できます。');
        }
        break;

      case 'tenpai':
        // テンパイの場合：待ち牌情報
        recommendations.push(`テンパイ！待ち牌: ${analysis.usefulTiles.join(', ')} (${analysis.usefulTileCount}枚)`);
        if (analysis.bestHandType === 'chitoitsu') {
          recommendations.push('七対子でのテンパイです。');
        } else if (analysis.bestHandType === 'kokushi') {
          recommendations.push('国士無双でのテンパイです。');
        }
        break;

      case 'incomplete':
        // 未完成の場合：シャンテン数と有効牌
        recommendations.push(`${analysis.shanten}シャンテン`);
        if (analysis.usefulTiles.length > 0) {
          recommendations.push(`有効牌: ${analysis.usefulTiles.join(', ')} (${analysis.usefulTileCount}枚)`);
        }
        
        // 手役の推奨
        if (analysis.bestHandType === 'chitoitsu') {
          recommendations.push('七対子を狙っています。');
        } else if (analysis.bestHandType === 'kokushi') {
          recommendations.push('国士無双を狙っています。');
        } else {
          recommendations.push('通常手を狙っています。');
        }
        break;
    }

    return {
      analysis,
      scoring,
      recommendations
    };
  }

  // 便利メソッド - 14枚の手牌文字列を期待
  public scoreHandFromString(
    tilesStr: string,
    drawnTile: string,
    isTsumo: boolean,
    gameContext: GameContext,
    options: {
      isRiichi?: boolean;
      openMelds?: OpenMeld[];
      bonuses?: BonusPoints;
    } = {}
  ): ScoringResult {
    const tiles = Tile.parseHandString(tilesStr);
    
    if (tiles.length !== 14) {
      throw new Error(`Hand string must represent exactly 14 tiles, got ${tiles.length}`);
    }

    const hand = Hand.fromString(tilesStr, {
      drawnTile,
      isTsumo,
      gameContext,
      isRiichi: options.isRiichi || false,
      openMelds: options.openMelds || []
    });

    // 上がり判定を最初に実行
    const handAnalysis = this.analyzeHandState(hand);
    if (handAnalysis.handState !== 'winning') {
      throw new Error(`Hand is not winning: ${handAnalysis.message}. Useful tiles: ${handAnalysis.usefulTiles?.join(', ') || 'none'}`);
    }

    return this.scoreHand(hand, options.bonuses || { riichiSticks: 0, honbaSticks: 0 });
  }

  /**
   * 副露表記を含む文字列から点数計算
   * 例: scoreHandWithMelds("123m456p11z [777p+]", "1z", true, gameContext)
   */
  public scoreHandWithMelds(
    handStr: string,
    drawnTile: string,
    isTsumo: boolean,
    gameContext: GameContext,
    options: {
      isRiichi?: boolean;
      bonuses?: BonusPoints;
    } = {}
  ): ScoringResult {
    const hand = Hand.fromStringWithMelds(handStr, {
      drawnTile,
      isTsumo,
      gameContext,
      isRiichi: options.isRiichi || false
    });

    // 副露がある場合は scoreHand 内部で適切に処理される
    return this.scoreHand(hand, options.bonuses || { riichiSticks: 0, honbaSticks: 0 });
  }

  public calculateShantenFromString(tilesStr: string, drawnTile: string, gameContext: GameContext): ShantenResult {
    const hand = Hand.fromString(tilesStr, {
      drawnTile,
      isTsumo: true,
      gameContext
    });
    return this.calculateShanten(hand);
  }

}
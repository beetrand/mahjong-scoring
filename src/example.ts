// 麻雀点数計算システム 使用例

import { MahjongScorer, createGameContext, Tile, Hand, HandParser } from './index';

function main() {
  console.log('=== 麻雀点数計算システム 使用例 ===\n');

  const scorer = new MahjongScorer();
  const gameContext = createGameContext(1, 1); // 東場、東家

  // 例1: リーチ・ツモ・平和・断幺九
  console.log('【例1】リーチ・ツモ・平和・断幺九');
  try {
    const result1 = scorer.scoreHandFromString(
      '234m567p345s2233z3z', // 14枚の手牌（和了牌含む）
      '3z',                   // 和了牌
      true,                   // ツモ
      gameContext,
      { isRiichi: true }
    );
    
    console.log(`役: ${result1.getDisplayString()}`);
    console.log(`翻数: ${result1.getTotalHan()}翻`);
    console.log(`符: ${result1.getTotalFu()}符`);
    console.log(`点数: ${result1.getFinalScore()}点`);
    console.log(`支払い: ${result1.paymentResult.totalPayment}点\n`);
  } catch (error: any) {
    console.log(`エラー: ${error.message}\n`);
  }

  // 例2: 七対子
  console.log('【例2】七対子');
  try {
    const result2 = scorer.scoreHandFromString(
      '1122m3344p5566s77z', // 14枚の手牌（和了牌含む）
      '7z',                  // 和了牌
      false,                 // ロン
      gameContext,
      { isRiichi: true }
    );
    
    console.log(`役: ${result2.getDisplayString()}`);
    console.log(`翻数: ${result2.getTotalHan()}翻`);
    console.log(`符: ${result2.getTotalFu()}符`);
    console.log(`点数: ${result2.getFinalScore()}点\n`);
  } catch (error: any) {
    console.log(`エラー: ${error.message}\n`);
  }

  // 例3: 三暗刻
  console.log('【例3】三暗刻');
  try {
    const result3 = scorer.scoreHandFromString(
      '111m222p333s56788p', // 14枚の手牌（和了牌含む）
      '8p',                 // 和了牌
      false,                // ロン
      gameContext
    );
    
    console.log(`役: ${result3.getDisplayString()}`);
    console.log(`翻数: ${result3.getTotalHan()}翻`);
    console.log(`符: ${result3.getTotalFu()}符`);
    console.log(`点数: ${result3.getFinalScore()}点\n`);
  } catch (error: any) {
    console.log(`エラー: ${error.message}\n`);
  }

  // 例4: シャンテン数計算
  console.log('【例4】シャンテン数計算');
  const testHands = [
    { hai: "123m456p78s11223z", tsumo: "3z" },
    { hai: "123m89m1289p1289s1z", tsumo: "9m" },
    { hai: "223456m123p4568s", tsumo: "6s" }
  ];
  
  testHands.forEach((testHand, index) => {
    const shantenResult = scorer.calculateShantenFromString(testHand.hai, testHand.tsumo, gameContext);
    console.log(`手牌${index + 1}: ${testHand.hai}`);
    console.log(`通常手シャンテン: ${shantenResult.regularShanten}`);
    console.log(`七対子シャンテン: ${shantenResult.chitoitsuShanten}`);
    console.log(`国士シャンテン: ${shantenResult.kokushiShanten}`);
    console.log(`最小シャンテン: ${shantenResult.shanten}`);
    console.log(`最適な手の形: ${shantenResult.handType}\n`);
  });

  // 例5: 手牌状態分析
  console.log('【例5】手牌状態分析');
  const analysisHand = Hand.fromString('123m456p789s1122z1m', {
    drawnTile: '1m',
    isTsumo: true,
    gameContext
  });
  const analysis = scorer.analyzeHandState(analysisHand);
  
  console.log(`手牌: 123m456p789s1122z1m`);
  console.log(`状態: ${analysis.message}`);
  console.log(`シャンテン数: ${analysis.shanten}`);
  console.log(`手型: ${analysis.bestHandType}\n`);

  // 例6: ボーナス点数込みの計算
  console.log('【例6】ボーナス点数込み（リーチ棒・本場）');
  try {
    const result6 = scorer.scoreHandFromString(
      '234m567p345s22334p', // 14枚の手牌（和了牌含む）
      '4p',
      true,
      gameContext,
      { 
        isRiichi: true,
        bonuses: { 
          riichiSticks: 2,  // リーチ棒2本
          honbaSticks: 3    // 3本場
        }
      }
    );
    
    console.log(`役: ${result6.getDisplayString()}`);
    console.log(`基本点数: ${result6.getFinalScore()}点`);
    console.log(`ボーナス: ${result6.paymentResult.bonusPayment}点`);
    console.log(`総支払い: ${result6.paymentResult.totalPayment}点\n`);
  } catch (error: any) {
    console.log(`エラー: ${error.message}\n`);
  }

  // 例7: 牌の基本操作
  console.log('【例7】牌の基本操作');
  demonstrateTileOperations();

  console.log('=== 使用例終了 ===');
}

function demonstrateTileOperations() {
  const tile1 = Tile.fromString('5pr'); // 赤五筒
  const tile2 = new Tile('1z'); // 東
  
  console.log(`赤五筒: ${tile1.toString()}, 赤ドラ: ${tile1.isRed}`);
  console.log(`東: ${tile2.toString()}, 字牌: ${tile2.isHonor()}`);
  
  const handTiles = HandParser.parseHandString('123m456p789s東東');
  console.log(`手牌解析: ${handTiles.map(t => t.toString()).join('')}`);
  console.log(`牌数: ${handTiles.length}枚\n`);
}

// 実行
main();
// バックトラッキング法のテスト

import { Hand } from '../common/hand';
import { HandParser } from '../common/hand-parser';
import { ShantenCalculator } from '../tensuu/shanten-calculator';

// テスト用のHandオブジェクトを作成
function createTestHand(tileStr: string): Hand {
  const tiles = HandParser.parseHandString(tileStr);
  const mockGameContext = {
    roundWind: 1 as any,
    playerWind: 1 as any,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: false
  };
  
  return new Hand(tiles, {
    drawnTile: tiles[tiles.length - 1].toString(),
    isTsumo: true,
    gameContext: mockGameContext,
    openMelds: []
  });
}

function testBacktracking() {
  console.log('=== バックトラッキング法テスト ===\n');

  const testCases = [
    {
      name: '新しい問題のケース（2345666m123p4566s）',
      tiles: '2345666m123p4566s',
      expectedShanten: 0,
      description: '234m(順子) + 56m(搭子) + 66m(雀頭) + 123p(順子) + 456s(順子) = テンパイ'
    },
    {
      name: 'バグ調査ケース（223456m123p4568s）',
      tiles: '223456m123p4568s',
      expectedShanten: 0,
      description: '22m(雀頭) + 345m(順子) + 123p(順子) + 456s(順子) = テンパイ'
    },
    {
      name: '問題のケース（11234567888999m）',
      tiles: '11234567888999m',
      expectedShanten: -1,
      description: '雀頭(11) + 順子(234,567) + 刻子(888,999)'
    },
    {
      name: '順子優先ケース（123456789m）',
      tiles: '123456789m11122z',
      expectedShanten: -1,
      description: '順子(123,456,789) + 刻子(111z) + 雀頭(22z)'
    },
    {
      name: '刻子優先ケース（111222333m）', 
      tiles: '111222333m11122z',
      expectedShanten: -1,
      description: '刻子(111,222,333) + 刻子(111z) + 雀頭(22z)'
    },
    {
      name: '混合ケース（111234555m）',
      tiles: '111234555m11122z',
      expectedShanten: -1,
      description: '刻子(111) + 順子(234) + 刻子(555) + 刻子(111z) + 雀頭(22z)'
    },
    {
      name: '複雑なケース（123345567m）',
      tiles: '123345567m11122z',
      expectedShanten: -1,
      description: '順子(123) + 順子(345) + 順子(567) + 刻子(111z) + 雀頭(22z)'
    },
    {
      name: '字牌テストケース（111222333z）',
      tiles: '111222333z111p22p',
      expectedShanten: -1,
      description: '刻子(111z) + 刻子(222z) + 刻子(333z) + 刻子(111p) + 雀頭(22p)'
    },
    {
      name: '字牌混在ケース（123m111z234s）',
      tiles: '123m111z234s111p1p',
      expectedShanten: 1,
      description: '順子(123m) + 刻子(111z) + 順子(234s) + 刻子(111p) + 単騎(1p) = 1シャンテン'
    }
  ];

  const calculator = new ShantenCalculator();

  testCases.forEach(testCase => {
    console.log(`\nテスト: ${testCase.name}`);
    console.log(`手牌: ${testCase.tiles}`);
    console.log(`説明: ${testCase.description}`);
    
    const hand = createTestHand(testCase.tiles);
    
    // 通常手のシャンテン数を計算（有効牌計算なし）
    const shantenResult = calculator.calculateShanten(hand, {includeUsefulTiles: false, includeWaitType: false});
    const shanten = shantenResult.shanten;
    const regularShanten = calculator.calculateRegularShanten(hand).shanten;
    
    console.log(`計算結果: ${shanten}シャンテン`);
    console.log(`通常手シャンテン: ${regularShanten}`);
    console.log(`期待値: ${testCase.expectedShanten}シャンテン`);
    console.log(`結果: ${shanten === testCase.expectedShanten ? '✓ 成功' : '✗ 失敗'}`);
    
    // 詳細版のテスト（デバッグログ付き）
    const detailedResult = calculator.calculateRegularShanten(hand, true, testCase.name.includes('新しい問題') || testCase.name.includes('バグ調査'));
    console.log(`詳細版シャンテン: ${detailedResult.shanten}`);
    console.log(`候補数: ${detailedResult.candidates.length}`);
    
    if (detailedResult.candidates.length > 0 && testCase.name === '問題のケース（11234567888999m）') {
      console.log('最適パターン（萬子部分）:');
      const candidate = detailedResult.candidates[0];
      const manCounts = candidate.getManCounts();
      console.log(`  残り牌: [${manCounts.join(',')}]`);
      console.log(`  解説: 11(雀頭として残る), 234567(面子として除去), 888999(面子として除去)`);
    }
  });

  // パフォーマンステスト
  console.log('\n\n=== パフォーマンステスト ===');
  const perfHand = createTestHand('11234567888999m');
  
  const startTime = Date.now();
  for (let i = 0; i < 1000; i++) {
    calculator.calculateShanten(perfHand);
  }
  const endTime = Date.now();
  
  console.log(`1000回の計算時間: ${endTime - startTime}ms`);
  console.log(`平均計算時間: ${(endTime - startTime) / 1000}ms`);
}

// テスト実行
testBacktracking();

export { testBacktracking };
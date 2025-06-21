// バックトラッキング法のテスト

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { BaseShantenCalculator } from '../tensuu/base-shanten-calculator';
import { ShantenCalculator } from '../tensuu/shanten-calculator';

// テスト用のHandオブジェクトを作成
function createTestHand(tileStr: string): Hand {
  const tiles = Tile.parseHandString(tileStr);
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
    }
  ];

  const calculator = new ShantenCalculator();
  const baseCalculator = new BaseShantenCalculator();

  testCases.forEach(testCase => {
    console.log(`\nテスト: ${testCase.name}`);
    console.log(`手牌: ${testCase.tiles}`);
    console.log(`説明: ${testCase.description}`);
    
    const hand = createTestHand(testCase.tiles);
    
    // 通常手のシャンテン数を計算
    const shanten = calculator.calculateShanten(hand);
    const regularShanten = baseCalculator.calculateRegularShantenFromHand(hand);
    
    console.log(`計算結果: ${shanten}シャンテン`);
    console.log(`通常手シャンテン: ${regularShanten}`);
    console.log(`期待値: ${testCase.expectedShanten}シャンテン`);
    console.log(`結果: ${shanten === testCase.expectedShanten ? '✓ 成功' : '✗ 失敗'}`);
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
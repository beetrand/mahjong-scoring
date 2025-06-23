// 手動でのシャンテン数テスト

import { Tile } from './src/common/tile';
import { Hand } from './src/common/hand';
import { ShantenCalculator } from './src/tensuu/shanten-calculator';
import { createMockGameContext } from './src/common/test-helpers';

function testSingleCase(tileIndices: number[], expected: {regular: number, kokushi: number, chitoitsu: number}) {
  const calculator = new ShantenCalculator();
  const gameContext = createMockGameContext();
  
  try {
    // 牌を作成
    const tiles = tileIndices.map(index => Tile.fromIndex(index));
    const drawnTile = tiles[tiles.length - 1];
    
    // 手牌文字列を作成
    const handString = tiles.map(tile => tile.toString()).join(' ');
    
    // Handオブジェクトを作成
    const hand = new Hand(tiles, [], {
      drawnTile: drawnTile.toString(),
      isTsumo: true,
      gameContext
    });
    
    // シャンテン数を計算
    const regularResult = calculator.calculateRegularShanten(hand);
    const kokushiResult = calculator.calculateKokushiShanten(hand);
    const chitoitsuResult = calculator.calculateChitoitsuShanten(hand);
    
    console.log(`手牌: ${handString}`);
    console.log(`インデックス: [${tileIndices.join(', ')}]`);
    console.log(`期待値: 通常=${expected.regular}, 国士=${expected.kokushi}, 七対=${expected.chitoitsu}`);
    console.log(`実際値: 通常=${regularResult.shanten}, 国士=${kokushiResult.shanten}, 七対=${chitoitsuResult.shanten}`);
    
    const regularMatch = regularResult.shanten === expected.regular;
    const kokushiMatch = kokushiResult.shanten === expected.kokushi;
    const chitoitsuMatch = chitoitsuResult.shanten === expected.chitoitsu;
    
    console.log(`結果: 通常=${regularMatch ? '✓' : '✗'}, 国士=${kokushiMatch ? '✓' : '✗'}, 七対=${chitoitsuMatch ? '✓' : '✗'}`);
    console.log('---');
    
    return regularMatch && kokushiMatch && chitoitsuMatch;
    
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// テストケース実行
console.log('=== 手動シャンテン数テスト ===\n');

const testCases = [
  {
    tiles: [2, 4, 8, 10, 14, 15, 18, 20, 22, 22, 25, 30, 31, 32], 
    expected: {regular: 4, kokushi: 8, chitoitsu: 5}
  },
  {
    tiles: [0, 3, 4, 7, 11, 16, 17, 20, 21, 23, 24, 26, 27, 30], 
    expected: {regular: 4, kokushi: 8, chitoitsu: 6}
  },
  {
    tiles: [0, 0, 1, 2, 6, 7, 9, 10, 11, 25, 27, 27, 28, 32], 
    expected: {regular: 2, kokushi: 7, chitoitsu: 4}
  },
  {
    tiles: [3, 4, 4, 5, 11, 11, 19, 19, 20, 21, 21, 22, 24, 27], 
    expected: {regular: 1, kokushi: 12, chitoitsu: 2}
  },
  {
    tiles: [0, 1, 1, 4, 4, 7, 10, 10, 11, 19, 21, 21, 25, 26], 
    expected: {regular: 3, kokushi: 11, chitoitsu: 2}
  }
];

let correctCount = 0;
testCases.forEach((testCase, index) => {
  console.log(`テストケース ${index + 1}:`);
  const result = testSingleCase(testCase.tiles, testCase.expected);
  if (result) correctCount++;
  console.log('');
});

console.log(`結果: ${correctCount}/${testCases.length} 件正解 (${((correctCount / testCases.length) * 100).toFixed(1)}%)`);
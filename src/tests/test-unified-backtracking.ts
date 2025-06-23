// 統一バックトラッキングアルゴリズムのテスト

import { Hand } from '../common/hand';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import { createMockGameContext } from '../common/test-helpers';

const calculator = new ShantenCalculator();
const gameContext = createMockGameContext();

// テストケース：既知のシャンテン数の手牌
const testCases = [
  {
    description: "天和（0シャンテン）",
    tiles: "1112345678999m",
    drawnTile: "9m",
    expectedShanten: -1
  },
  {
    description: "テンパイ（0シャンテン）", 
    tiles: "1112345678999m",
    drawnTile: "1m",
    expectedShanten: 0
  },
  {
    description: "イーシャンテン",
    tiles: "1123456789999m",
    drawnTile: "9m", 
    expectedShanten: 1
  },
  {
    description: "リャンシャンテン",
    tiles: "1123456799999m",
    drawnTile: "9m",
    expectedShanten: 2
  },
  {
    description: "複雑な手牌1",
    tiles: "359m267p13558s456z",
    drawnTile: "6z",
    expectedShanten: 3
  },
  {
    description: "複雑な手牌2", 
    tiles: "4556m33p2234457s1z",
    drawnTile: "1z",
    expectedShanten: 2
  }
];

console.log("=== 統一バックトラッキングアルゴリズム テスト ===\n");

let passedTests = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
  try {
    const hand = new Hand(testCase.tiles, {
      drawnTile: testCase.drawnTile,
      isTsumo: true,
      gameContext
    });

    const result = calculator.calculateRegularShanten(hand, false, true);
    const actualShanten = result.shanten;
    
    const passed = actualShanten === testCase.expectedShanten;
    if (passed) {
      passedTests++;
      console.log(`✓ ${testCase.description}: ${actualShanten} シャンテン (期待値: ${testCase.expectedShanten})`);
    } else {
      console.log(`✗ ${testCase.description}: ${actualShanten} シャンテン (期待値: ${testCase.expectedShanten})`);
    }
    
    console.log(`  手牌: ${testCase.tiles} ツモ: ${testCase.drawnTile}\n`);
    
  } catch (error) {
    console.error(`エラー - ${testCase.description}:`, error);
    console.log(`  手牌: ${testCase.tiles} ツモ: ${testCase.drawnTile}\n`);
  }
}

console.log(`=== テスト結果 ===`);
console.log(`成功: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);

if (passedTests === totalTests) {
  console.log("🎉 全てのテストが成功しました！統一バックトラッキングアルゴリズムは正常に動作しています。");
} else {
  console.log("⚠️  一部のテストが失敗しました。アルゴリズムの見直しが必要かもしれません。");
}
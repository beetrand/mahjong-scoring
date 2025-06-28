import { EffectiveTilesCalculator } from "./tensuu/effective-tiles-calculator";
import { Hand } from "./common/hand"
import  { Wind } from "./common/types";
import type {GameContext} from "./common/types"

const effectiveTilesCalculator = new EffectiveTilesCalculator();

// テストケース配列
const testCases = [
  {
    name: "和了形テスト（シャンテン-1）",
    handString: '123m456p789s11222z',
    drawnTile: '2z',
    expected: "有効牌なし（既に和了）"
  },
  {
    name: "テンパイテスト（シャンテン0）", 
    handString: '123m456p789s11233z',
    drawnTile: '3z',
    expected: "2z のみ"
  },
  {
    name: "1シャンテンテスト（通常手）",
    handString: '123m456p78s11223z',
    drawnTile: '3z',
    expected: "6s, 9s"
  },
  {
    name: "2シャンテンテスト（複数改善）",
    handString: '123m45p78s112234z',
    drawnTile: '4z',
    expected: "3p, 6p, 6s, 9s, 1z, 2z, 3z"
  },
  {
    name: "七対子狙いテスト",
    handString: '1122m3344p5566s12z',
    drawnTile: '2z',
    expected: "1z, 2z（七対子）"
  },
  {
    name: "国士無双狙いテスト",
    handString: '19m19p19s12345617z',
    drawnTile: '1z',
    expected: "なし（既に13種揃い）"
  },
  {
    name: "複雑な手牌テスト",
    handString: '11234m567p89s2233z',
    drawnTile: '3z',
    expected: "複数の有効牌"
  },
  {
    name: "面子候補が多い手牌",
    handString: '112233m445566p78z',
    drawnTile: '8z',
    expected: "7z（対子完成）"
  }
];

console.log('=== 有効牌計算テスト開始 ===\n');

testCases.forEach((testCase, index) => {
  console.log(`--- テスト ${index + 1}: ${testCase.name} ---`);
  console.log(`手牌: ${testCase.handString} + ${testCase.drawnTile}`);
  
  try {
    const hand = Hand.fromString(testCase.handString, {
      drawnTile: testCase.drawnTile,
      isTsumo: true,
      gameContext: createMockGameContext()
    });

    const result = effectiveTilesCalculator.calculateEffectiveTiles(hand);
    
    console.log(`現在のシャンテン数: ${result.currentShanten}`);
    console.log(`有効牌数: ${result.tiles.length}`);
    
    if (result.tiles.length > 0) {
      console.log(`有効牌: [${result.tiles.map(t => t.toString()).join(', ')}]`);
    } else {
      console.log('有効牌: なし');
    }
    
    console.log(`期待値: ${testCase.expected}`);
    
  } catch (error) {
    console.error(`エラー: ${error}`);
  }
  
  console.log('');
});

console.log('=== テスト終了 ===');

function createMockGameContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    roundWind: Wind.EAST,
    playerWind: Wind.EAST,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: false,
    ...overrides
  };
}
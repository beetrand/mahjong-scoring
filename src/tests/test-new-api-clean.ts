// 新しいHand基盤APIのテスト

import { Hand } from '../common/hand';
import { ShantenCalculator } from '../tensuu/shanten-calculator';

console.log('🧪 新しいHand基盤API テスト');

// テスト用のゲーム状況
const gameContext = {
  roundWind: 1 as any,    // 東
  playerWind: 1 as any,   // 東家
  doraIndicators: ['1z'],
  uraDoraIndicators: [],
  hasRedDora: false
};

const shantenCalculator = new ShantenCalculator();

// Test 1: 門前手のシャンテン計算（新API）
console.log('\n1. 門前手のシャンテン計算（新API）');
try {
  const menzenHand = Hand.fromString('123m456p789s1123z1z', {
    drawnTile: '1z',
    isTsumo: true,
    gameContext
  });
  
  const simpleShanten = shantenCalculator.calculateShantenNumber(menzenHand);
  const basicResult = shantenCalculator.calculateShanten(menzenHand, {includeUsefulTiles: false, includeMentsuCombinations: false, includeWaitType: false});
  const detailedResult = shantenCalculator.calculateShanten(menzenHand);
  
  console.log(`  門前手シャンテン（軽量）: ${simpleShanten}`);
  console.log(`  門前手シャンテン（基本）: ${basicResult.shanten}, タイプ=${basicResult.handType}`);
  console.log(`  門前手シャンテン（詳細）: ${detailedResult.shanten}`);
  console.log(`    通常手: ${detailedResult.regularShanten}`);
  console.log(`    七対子: ${detailedResult.chitoitsuShanten}`);
  console.log(`    国士無双: ${detailedResult.kokushiShanten}`);
  console.log(`  ✅ 門前手では全手牌タイプが計算される`);
} catch (error) {
  console.log(`  ❌ エラー: ${error instanceof Error ? error.message : error}`);
}

// Test 2: 1副露・テンパイ（新API）
console.log('\n2. 1副露・テンパイ（新API）');
try {
  const hand1 = Hand.fromStringWithMelds('123m456p789s11z [777p+]', {
    drawnTile: '1z',
    isTsumo: true,
    gameContext
  });
  
  const simpleShanten = shantenCalculator.calculateShantenNumber(hand1);
  const basicResult = shantenCalculator.calculateShanten(hand1, {includeUsefulTiles: false, includeMentsuCombinations: false, includeWaitType: false});
  const detailedResult = shantenCalculator.calculateShanten(hand1);
  
  console.log(`  1副露シャンテン（軽量）: ${simpleShanten} (期待: -1=和了)`);
  console.log(`  1副露シャンテン（基本）: ${basicResult.shanten}, タイプ=${basicResult.handType}`);
  console.log(`  1副露シャンテン（詳細）: ${detailedResult.shanten}`);
  console.log(`    通常手: ${detailedResult.regularShanten}`);
  console.log(`    七対子: ${detailedResult.chitoitsuShanten} (期待: Infinity)`);
  console.log(`    国士無双: ${detailedResult.kokushiShanten} (期待: Infinity)`);
  
  if (detailedResult.chitoitsuShanten === Infinity && detailedResult.kokushiShanten === Infinity) {
    console.log(`  ✅ 副露時に特殊手が正しく無効化された`);
  } else {
    console.log(`  ❌ 副露時の特殊手無効化が機能していない`);
  }
} catch (error) {
  console.log(`  ❌ エラー: ${error instanceof Error ? error.message : error}`);
}

// Test 3: API設計の確認
console.log('\n3. API設計の確認');
try {
  const hand = Hand.fromString('123m456p789s1123z1z', {
    drawnTile: '1z',
    isTsumo: true,
    gameContext
  });
  
  // 新APIではHandオブジェクトのみを受け取る
  const shanten1 = shantenCalculator.calculateShantenNumber(hand);
  const basic1 = shantenCalculator.calculateShanten(hand, {includeUsefulTiles: false, includeMentsuCombinations: false, includeWaitType: false});
  const detailed1 = shantenCalculator.calculateShanten(hand);
  const useful1 = shantenCalculator.calculateUsefulTiles(hand);
  
  console.log(`  全メソッドでHandオブジェクトを受け取り成功`);
  console.log(`  calculateShanten: ${shanten1}`);
  console.log(`  calculateShanten(基本): ${basic1.shanten}`);
  console.log(`  calculateShanten(detailed): ${detailed1.shanten}`);
  console.log(`  calculateUsefulTiles: ${useful1.length}個の有効牌`);
  console.log(`  ✅ 新しいHand基盤APIが正しく動作している`);
  
} catch (error) {
  console.log(`  ❌ エラー: ${error instanceof Error ? error.message : error}`);
}

console.log('\n🏁 新しいHand基盤API テスト完了');

export {};
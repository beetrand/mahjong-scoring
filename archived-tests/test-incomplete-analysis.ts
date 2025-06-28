// 未完成部分分析のデバッグテスト

import { Hand } from '../common/hand';
import { HandParser } from '../common/hand-parser';
import { EffectiveTilesCalculator } from '../tensuu/effective-tiles-calculator';
import { ShantenCalculator } from '../tensuu/shanten-calculator';

function testIncompleteAnalysis() {
  console.log('=== 未完成部分分析のデバッグテスト ===\n');
  
  const shantenCalculator = new ShantenCalculator();
  const effectiveTilesCalculator = new EffectiveTilesCalculator();

  // テストケース1: 搭子1つパターン
  console.log('テストケース1: 45m123s456p789p22z (搭子1つ + 対子1つ)');
  testCase('45m123s456p789p22z', shantenCalculator, effectiveTilesCalculator);

  // テストケース2: シャンポンパターン  
  console.log('\nテストケース2: 123m456s789p11z22z (対子2つ)');
  testCase('123m456s789p11z22z', shantenCalculator, effectiveTilesCalculator);

  // テストケース3: 単騎パターン
  console.log('\nテストケース3: 111m222s333p444z5z (孤立牌1つ)');
  testCase('111m222s333p444z5z', shantenCalculator, effectiveTilesCalculator);
}

function testCase(handStr: string, shantenCalc: ShantenCalculator, effectiveCalc: EffectiveTilesCalculator) {
  const tiles = HandParser.parseHandString(handStr);
  const hand = Hand.create(tiles, [], { drawnTile: null });
  
  console.log(`手牌: ${handStr}`);
  
  // シャンテン計算
  const shantenResult = shantenCalc.calculateShanten(hand, true);
  console.log(`シャンテン数: ${shantenResult.shanten}`);
  console.log(`面子構成数: ${shantenResult.optimalStates?.length || 0}`);
  
  if (shantenResult.optimalStates) {
    shantenResult.optimalStates.forEach((comp, i) => {
      console.log(`\n構成${i + 1}の全コンポーネント:`);
      comp.components.forEach((component, j) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`  ${j}: ${component.type} [${tilesStr}]`);
      });
      
      // 完成面子と未完成部分を分類
      const completed = comp.components.filter(c => 
        c.type === 'sequence' || c.type === 'triplet' || c.type === 'quad'
      );
      const incomplete = comp.components.filter(c => 
        c.type === 'taatsu' || c.type === 'pair' || c.type === 'isolated'
      );
      
      console.log(`  完成面子: ${completed.length}個`);
      completed.forEach(c => {
        const tilesStr = c.tiles.map(t => t.toString()).join('');
        console.log(`    ${c.type} [${tilesStr}]`);
      });
      
      console.log(`  未完成部分: ${incomplete.length}個`);
      incomplete.forEach(c => {
        const tilesStr = c.tiles.map(t => t.toString()).join('');
        console.log(`    ${c.type} [${tilesStr}]`);
      });
    });
  }
  
  // 有効牌計算
  if (shantenResult.shanten === 0) {
    const tenpaiResult = effectiveCalc.calculateTenpaiEffectiveTiles(hand);
    if (tenpaiResult) {
      console.log(`\n有効牌分析結果:`);
      console.log(`全有効牌: [${tenpaiResult.allEffectiveTiles.map(t => t.toString()).join(', ')}]`);
      
      tenpaiResult.compositionsWithEffectiveTiles.forEach((compInfo, i) => {
        console.log(`\n構成${i + 1}の有効牌コンポーネント:`);
        compInfo.componentsWithEffectiveTiles.forEach(cwt => {
          const compTilesStr = cwt.component.tiles.map(t => t.toString()).join('');
          const effectiveStr = cwt.effectiveTiles.map(t => t.toString()).join(', ');
          console.log(`  ${cwt.component.type} [${compTilesStr}] → [${effectiveStr}] (${cwt.waitType})`);
        });
      });
    }
  }
  
  console.log('\n' + '='.repeat(50));
}

testIncompleteAnalysis();
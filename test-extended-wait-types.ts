// 拡張された待ちタイプ計算の総合テスト

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';
import { EffectiveTilesCalculator } from './src/tensuu/effective-tiles-calculator';

function testExtendedWaitTypes() {
  console.log('=== 拡張された待ちタイプ計算の総合テスト ===\n');
  
  const analyzer = new HandAnalyzer();
  const effectiveTilesCalculator = new EffectiveTilesCalculator();

  // テストケース1: 単騎待ち（4面子1孤立牌）
  console.log('テストケース1: 111m222s333p444z5z (13枚、5z単騎待ち)');
  
  const tiles1 = [
    ...HandParser.parseHandString('111m'),     // 完成面子
    ...HandParser.parseHandString('222s'),     // 完成面子
    ...HandParser.parseHandString('333p'),     // 完成面子
    ...HandParser.parseHandString('444z'),     // 完成面子
    ...HandParser.parseHandString('5z')        // 孤立牌（単騎待ち）
  ];
  
  const hand1 = Hand.create(tiles1, [], { drawnTile: null });
  console.log(`手牌: ${tiles1.map(t => t.toString()).join('')}`);
  
  testHandDetails(hand1, analyzer, effectiveTilesCalculator);

  // テストケース2: シャンポン待ち（3面子2雀頭）
  console.log('\n\nテストケース2: 123m456s789p11z22z (13枚、1z2zシャンポン待ち)');
  
  const tiles2 = [
    ...HandParser.parseHandString('123m'),     // 完成面子
    ...HandParser.parseHandString('456s'),     // 完成面子
    ...HandParser.parseHandString('789p'),     // 完成面子
    ...HandParser.parseHandString('11z'),      // 対子1
    ...HandParser.parseHandString('22z')       // 対子2
  ];
  
  const hand2 = Hand.create(tiles2, [], { drawnTile: null });
  console.log(`手牌: ${tiles2.map(t => t.toString()).join('')}`);
  
  testHandDetails(hand2, analyzer, effectiveTilesCalculator);

  // テストケース3: 混合パターン（塔子+孤立牌）
  console.log('\n\nテストケース3: 12m123s456p789p1z (13枚、3m待ち、1z単騎待ち)');
  
  const tiles3 = [
    ...HandParser.parseHandString('12m'),      // 塔子（3m待ち）
    ...HandParser.parseHandString('123s'),     // 完成面子
    ...HandParser.parseHandString('456p'),     // 完成面子
    ...HandParser.parseHandString('789p'),     // 完成面子
    ...HandParser.parseHandString('1z')        // 孤立牌（1z単騎待ち）
  ];
  
  const hand3 = Hand.create(tiles3, [], { drawnTile: null });
  console.log(`手牌: ${tiles3.map(t => t.toString()).join('')}`);
  
  testHandDetails(hand3, analyzer, effectiveTilesCalculator);

  // テストケース4: 複雑なパターン（複数の待ちタイプ）
  console.log('\n\nテストケース4: 23m45m789p11z2z (13枚、1m4m6mリャンメン、2z単騎待ち)');
  
  const tiles4 = [
    ...HandParser.parseHandString('23m'),      // 塔子1（1m4mリャンメン）
    ...HandParser.parseHandString('45m'),      // 塔子2（3m6mリャンメン）
    ...HandParser.parseHandString('789p'),     // 完成面子
    ...HandParser.parseHandString('11z'),      // 対子
    ...HandParser.parseHandString('2z')        // 孤立牌（2z単騎待ち）
  ];
  
  const hand4 = Hand.create(tiles4, [], { drawnTile: null });
  console.log(`手牌: ${tiles4.map(t => t.toString()).join('')}`);
  
  testHandDetails(hand4, analyzer, effectiveTilesCalculator);
}

function testHandDetails(hand: Hand, analyzer: HandAnalyzer, calculator: EffectiveTilesCalculator) {
  // 基本情報
  const progress = analyzer.analyzeHandProgress(hand);
  console.log(`シャンテン数: ${progress.shanten}`);
  console.log(`テンパイ: ${progress.isTenpai}`);
  console.log(`有効牌: [${progress.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  
  // テンパイ時の詳細分析
  if (progress.tenpaiEffectiveTiles) {
    console.log(`\nテンパイ時の詳細:`);
    console.log(`面子構成数: ${progress.tenpaiEffectiveTiles.compositionsWithEffectiveTiles.length}`);
    
    progress.tenpaiEffectiveTiles.compositionsWithEffectiveTiles.forEach((compInfo, i) => {
      console.log(`\n構成${i + 1}:`);
      compInfo.composition.components.forEach((comp, j) => {
        const tilesStr = comp.tiles.map(t => t.toString()).join('');
        console.log(`  ${j}: ${comp.type} [${tilesStr}]`);
      });
      
      console.log('  有効牌を持つコンポーネント:');
      compInfo.componentsWithEffectiveTiles.forEach(compWithTiles => {
        const compTilesStr = compWithTiles.component.tiles.map(t => t.toString()).join('');
        const effectiveStr = compWithTiles.effectiveTiles.map(t => t.toString()).join(', ');
        console.log(`    ${compWithTiles.component.type} [${compTilesStr}] → [${effectiveStr}] (${compWithTiles.waitType})`);
      });
      
      if (compInfo.componentsWithEffectiveTiles.length === 0) {
        console.log('    なし');
      }
    });
  }
  
  // 待ちタイプ分析
  const waitResult = analyzer.analyzeWaitTypes(hand);
  console.log('\n待ちタイプ分析:');
  waitResult.waitingTiles.forEach(info => {
    console.log(`  ${info.tile}: [${info.waitTypes.join(', ')}]`);
  });
  console.log(`複数待ちタイプ: ${waitResult.hasMultipleWaitTypes}`);
}

testExtendedWaitTypes();
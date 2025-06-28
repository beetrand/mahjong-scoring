// テンパイ時の有効牌計算（新設計）のテスト

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';
import { EffectiveTilesCalculator } from './src/tensuu/effective-tiles-calculator';

function testTenpaiEffectiveTiles() {
  console.log('=== テンパイ時の有効牌計算（新設計）テスト ===\n');
  
  const analyzer = new HandAnalyzer();
  const effectiveTilesCalculator = new EffectiveTilesCalculator();

  // テストケース1: シンプルなテンパイ
  console.log('テストケース1: 12m456s789p111z2z (13枚、3m待ち)');
  
  const tiles1 = [
    ...HandParser.parseHandString('12m'),      // 塔子
    ...HandParser.parseHandString('456s'),     // 完成面子
    ...HandParser.parseHandString('789p'),     // 完成面子
    ...HandParser.parseHandString('111z'),     // 完成面子
    ...HandParser.parseHandString('22z')       // 対子
  ];
  
  const hand1 = Hand.create(tiles1, [], { drawnTile: null });
  
  // 通常の有効牌計算
  const normalResult = effectiveTilesCalculator.calculateEffectiveTiles(hand1);
  console.log(`シャンテン数: ${normalResult.currentShanten}`);
  console.log(`有効牌: [${normalResult.tiles.map(t => t.toString()).join(', ')}]`);
  
  // テンパイ時の詳細計算
  const tenpaiResult = effectiveTilesCalculator.calculateTenpaiEffectiveTiles(hand1);
  if (tenpaiResult) {
    console.log(`\nテンパイ時の詳細:`);
    console.log(`面子構成数: ${tenpaiResult.compositionsWithEffectiveTiles.length}`);
    console.log(`全有効牌: [${tenpaiResult.allEffectiveTiles.map(t => t.toString()).join(', ')}]`);
    
    tenpaiResult.compositionsWithEffectiveTiles.forEach((comp, i) => {
      console.log(`\n構成${i + 1}:`);
      comp.composition.components.forEach((component, j) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`  ${j}: ${component.type} [${tilesStr}]`);
      });
      
      console.log('  塔子と有効牌:');
      comp.taatsuWithEffectiveTiles.forEach(taatsuInfo => {
        const taatsuStr = taatsuInfo.taatsu.tiles.map(t => t.toString()).join('');
        const effectiveStr = taatsuInfo.effectiveTiles.map(t => t.toString()).join(', ');
        console.log(`    [${taatsuStr}] → [${effectiveStr}]`);
      });
    });
  }
  
  // テストケース2: 一つの塔子のテンパイ（確実にテンパイ） 
  console.log('\n\nテストケース2: 45m123s456p789p22z (13枚、3m6m待ち)');
  
  const tiles2 = [
    ...HandParser.parseHandString('45m'),      // 塔子 (3m6m待ち)
    ...HandParser.parseHandString('123s'),     // 完成面子
    ...HandParser.parseHandString('456p'),     // 完成面子
    ...HandParser.parseHandString('789p'),     // 完成面子
    ...HandParser.parseHandString('22z')       // 対子
  ];
  
  const hand2 = Hand.create(tiles2, [], { drawnTile: null });
  
  // 通常の有効牌計算
  const normalResult2 = effectiveTilesCalculator.calculateEffectiveTiles(hand2);
  console.log(`シャンテン数: ${normalResult2.currentShanten}`);
  console.log(`有効牌: [${normalResult2.tiles.map(t => t.toString()).join(', ')}]`);
  
  // テンパイ時の詳細計算
  const tenpaiResult2 = effectiveTilesCalculator.calculateTenpaiEffectiveTiles(hand2);
  if (tenpaiResult2) {
    console.log(`\nテンパイ時の詳細:`);
    console.log(`面子構成数: ${tenpaiResult2.compositionsWithEffectiveTiles.length}`);
    
    tenpaiResult2.compositionsWithEffectiveTiles.forEach((comp, i) => {
      console.log(`\n構成${i + 1}:`);
      console.log('  塔子と有効牌:');
      comp.taatsuWithEffectiveTiles.forEach(taatsuInfo => {
        const taatsuStr = taatsuInfo.taatsu.tiles.map(t => t.toString()).join('');
        const effectiveStr = taatsuInfo.effectiveTiles.map(t => t.toString()).join(', ');
        console.log(`    [${taatsuStr}] → [${effectiveStr}]`);
      });
    });
  }
  
  // テストケース3: HandAnalyzerでの統合確認
  console.log('\n\nテストケース3: HandAnalyzerでの統合確認');
  
  const progress = analyzer.analyzeHandProgress(hand2);
  console.log(`テンパイ: ${progress.isTenpai}`);
  console.log(`有効牌: [${progress.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  
  if (progress.tenpaiEffectiveTiles) {
    console.log('テンパイ詳細情報: あり');
    console.log(`面子構成数: ${progress.tenpaiEffectiveTiles.compositionsWithEffectiveTiles.length}`);
  } else {
    console.log('テンパイ詳細情報: なし');
  }
  
  // 待ちタイプの判定
  const waitResult = analyzer.analyzeWaitTypes(hand2);
  console.log('\n待ちタイプ:');
  waitResult.waitingTiles.forEach(info => {
    console.log(`  ${info.tile}: [${info.waitTypes.join(', ')}]`);
  });
}

testTenpaiEffectiveTiles();
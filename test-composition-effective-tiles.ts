// 面子構成と有効牌の新構造テスト

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';

function testCompositionEffectiveTiles() {
  console.log('=== 面子構成と有効牌の新構造テスト ===\n');
  
  const analyzer = new HandAnalyzer();

  // テストケース1: 12m456s789p111z2z (テンパイ状態、3m待ち)
  console.log('テストケース1: 12m456s789p111z2z');
  
  const tiles1 = [
    ...HandParser.parseHandString('12m'),      // 塔子
    ...HandParser.parseHandString('456s'),     // 完成面子
    ...HandParser.parseHandString('789p'),     // 完成面子
    ...HandParser.parseHandString('111z'),     // 完成面子
    ...HandParser.parseHandString('22z')       // 対子
  ];
  
  const hand1 = Hand.create(tiles1, [], { drawnTile: null });
  const progress1 = analyzer.analyzeHandProgress(hand1);
  
  console.log(`手牌: ${tiles1.map(t => t.toString()).join('')}`);
  console.log(`シャンテン数: ${progress1.shanten}`);
  console.log(`テンパイ: ${progress1.isTenpai}`);
  console.log(`有効牌（従来）: [${progress1.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  
  if (progress1.compositionsWithEffectiveTiles) {
    console.log(`\n面子構成と有効牌（新構造）:`);
    console.log(`構成数: ${progress1.compositionsWithEffectiveTiles.length}`);
    
    progress1.compositionsWithEffectiveTiles.forEach((item, index) => {
      console.log(`\n構成${index + 1}:`);
      item.composition.components.forEach((comp, i) => {
        const tilesStr = comp.tiles.map(t => t.toString()).join('');
        console.log(`  ${i}: ${comp.type} [${tilesStr}]`);
      });
      console.log(`  有効牌: [${item.effectiveTiles.map(t => t.toString()).join(', ')}]`);
    });
  } else {
    console.log('\n面子構成と有効牌（新構造）: なし');
  }
  
  // テストケース2: 1112345678999m (テンパイ、清一色で複数構成の可能性) 
  console.log('\n\nテストケース2: 1112345678999m');
  
  const tiles2 = [
    ...HandParser.parseHandString('1112345678999m')
  ];
  
  const hand2 = Hand.create(tiles2, [], { drawnTile: null });
  const progress2 = analyzer.analyzeHandProgress(hand2);
  
  console.log(`手牌: ${tiles2.map(t => t.toString()).join('')}`);
  console.log(`シャンテン数: ${progress2.shanten}`);
  console.log(`テンパイ: ${progress2.isTenpai}`);
  console.log(`有効牌（従来）: [${progress2.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  
  if (progress2.compositionsWithEffectiveTiles) {
    console.log(`\n面子構成と有効牌（新構造）:`);
    console.log(`構成数: ${progress2.compositionsWithEffectiveTiles.length}`);
    
    progress2.compositionsWithEffectiveTiles.forEach((item, index) => {
      console.log(`\n構成${index + 1}:`);
      item.composition.components.forEach((comp, i) => {
        const tilesStr = comp.tiles.map(t => t.toString()).join('');
        console.log(`  ${i}: ${comp.type} [${tilesStr}]`);
      });
      console.log(`  有効牌: [${item.effectiveTiles.map(t => t.toString()).join(', ')}]`);
    });
  }
  
  // テストケース3: 1シャンテンの場合（新構造は生成されないはず）
  console.log('\n\nテストケース3: 123m456s789p112z2m (1シャンテン)');
  
  const tiles3 = [
    ...HandParser.parseHandString('123m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('112z'),
    ...HandParser.parseHandString('2m')
  ];
  
  const hand3 = Hand.create(tiles3, [], { drawnTile: null });
  const progress3 = analyzer.analyzeHandProgress(hand3);
  
  console.log(`手牌: ${tiles3.map(t => t.toString()).join('')}`);
  console.log(`シャンテン数: ${progress3.shanten}`);
  console.log(`テンパイ: ${progress3.isTenpai}`);
  console.log(`有効牌（従来）: [${progress3.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  console.log(`面子構成と有効牌（新構造）: ${progress3.compositionsWithEffectiveTiles ? 'あり' : 'なし（1シャンテンのため）'}`);
}

testCompositionEffectiveTiles();
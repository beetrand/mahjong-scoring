// 和了分析リファクタリング後のテスト

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';

function testWinningAnalysisRefactor() {
  console.log('=== 和了分析リファクタリング後のテスト ===\n');
  
  const analyzer = new HandAnalyzer();

  // テストケース1: 12345m で 3m 自摸
  console.log('テストケース1: 12345m456s789p11z で 3m 自摸');
  
  const tiles1 = [
    ...HandParser.parseHandString('1245m'),    // 4枚
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z'),
    HandParser.parseHandString('3m')[0]        // 自摸牌も含める
  ];
  
  const hand1 = Hand.create(tiles1, [], { 
    drawnTile: '3m',
    isTsumo: true 
  });
  
  // まず手牌の状態を確認
  console.log('手牌:', hand1.getConcealedTiles().map(t => t.toString()).join(''));
  console.log('自摸牌:', hand1.drawnTile?.toString());
  
  const progress1 = analyzer.analyzeHandProgress(hand1);
  console.log(`テンパイ: ${progress1.isTenpai}`);
  console.log(`有効牌: [${progress1.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  
  const result1 = analyzer.analyzeWinning(hand1);
  
  console.log(`和了: ${result1.isWinning}`);
  
  if (result1.isWinning && result1.winningInfo) {
    console.log(`和了牌: ${result1.winningInfo.winningTile}`);
    console.log(`面子構成と待ちタイプの組み合わせ数: ${result1.winningInfo.compositionsWithWaitTypes.length}`);
    
    result1.winningInfo.compositionsWithWaitTypes.forEach((item, index) => {
      console.log(`\n  組み合わせ${index + 1}:`);
      console.log(`    待ちタイプ: ${item.waitType}`);
      console.log(`    手牌タイプ: ${item.composition.handType}`);
      console.log(`    和了牌位置: 面子${item.composition.winningTilePosition.componentIndex}, 位置${item.composition.winningTilePosition.positionInComponent}`);
      console.log(`    面子構成:`);
      
      item.composition.components.forEach((comp, compIndex) => {
        const tilesStr = comp.tiles.map(t => t.toString()).join('');
        const marker = compIndex === item.composition.winningTilePosition.componentIndex ? ' ← 和了面子' : '';
        console.log(`      ${compIndex}: ${comp.type} [${tilesStr}]${marker}`);
      });
    });
  }
  
  // テストケース2: より複雑なケース
  console.log('\n\nテストケース2: 1234567m999s11z で 2m 自摸');
  
  const tiles2 = [
    ...HandParser.parseHandString('1234567m'),
    ...HandParser.parseHandString('999s'),
    ...HandParser.parseHandString('11z')
  ];
  
  const hand2 = Hand.create(tiles2, [], { 
    drawnTile: '2m',
    isTsumo: true 
  });
  
  const result2 = analyzer.analyzeWinning(hand2);
  
  console.log(`和了: ${result2.isWinning}`);
  
  if (result2.isWinning && result2.winningInfo) {
    console.log(`和了牌: ${result2.winningInfo.winningTile}`);
    console.log(`面子構成と待ちタイプの組み合わせ数: ${result2.winningInfo.compositionsWithWaitTypes.length}`);
    
    result2.winningInfo.compositionsWithWaitTypes.forEach((item, index) => {
      console.log(`\n  組み合わせ${index + 1}:`);
      console.log(`    待ちタイプ: ${item.waitType}`);
      console.log(`    手牌タイプ: ${item.composition.handType}`);
      console.log(`    和了牌位置: 面子${item.composition.winningTilePosition.componentIndex}, 位置${item.composition.winningTilePosition.positionInComponent}`);
      console.log(`    面子構成:`);
      
      item.composition.components.forEach((comp, compIndex) => {
        const tilesStr = comp.tiles.map(t => t.toString()).join('');
        const marker = compIndex === item.composition.winningTilePosition.componentIndex ? ' ← 和了面子' : '';
        console.log(`      ${compIndex}: ${comp.type} [${tilesStr}]${marker}`);
      });
    });
  }
  
  // テストケース3: 和了しない場合（有効牌以外を自摸）
  console.log('\n\nテストケース3: 12345m456s789p11z で 8m 自摸（和了しない）');
  
  const tiles3 = [
    ...HandParser.parseHandString('12345m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z'),
    HandParser.parseHandString('8m')[0]  // 8mを手牌に含める
  ];
  
  const hand3 = Hand.create(tiles3, [], { 
    drawnTile: '8m',
    isTsumo: true 
  });
  
  const result3 = analyzer.analyzeWinning(hand3);
  
  console.log(`和了: ${result3.isWinning}`);
  console.log(`テンパイ: ${result3.handProgress.isTenpai}`);
  console.log(`シャンテン数: ${result3.handProgress.shanten}`);
}

testWinningAnalysisRefactor();
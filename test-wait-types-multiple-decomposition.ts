// 複数の面子分解パターンでの待ちタイプ判定テスト

import { Hand } from './src/common/hand';
import { Tile } from './src/common/tile';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';
import { WaitType } from './src/common/types';
import { HandParser } from './src/common/hand-parser';

function testMultipleDecompositionWaitTypes() {
  const analyzer = new HandAnalyzer();

  console.log('=== 複数面子分解パターンでの待ちタイプテスト ===\n');

  // テストケース1: 12345m (3m待ちがペンチャンとリャンメンの両方になる)
  console.log('テストケース1: 12345m で 3m 待ち');
  console.log('期待: 3m がペンチャンとリャンメンの両方');
  
  const tiles1 = [
    // 12345m のテンパイ形を作成
    ...HandParser.parseHandString('12345m'),
    ...HandParser.parseHandString('456s'),     // 完成面子
    ...HandParser.parseHandString('789p'),     // 完成面子
    ...HandParser.parseHandString('11z')       // 東東（完成対子）
  ];
  
  const hand1 = Hand.create(tiles1, [], { drawnTile: null });
  const result1 = analyzer.analyzeWaitTypes(hand1);
  
  console.log('結果:');
  for (const waitInfo of result1.waitingTiles) {
    console.log(`  ${waitInfo.tile}: [${waitInfo.waitTypes.join(', ')}]`);
  }
  console.log(`複数の待ちタイプ: ${result1.hasMultipleWaitTypes}\n`);

  // 3m待ちの詳細確認
  const tile3m = result1.waitingTiles.find(info => info.tile.toString() === '3m');
  if (tile3m) {
    const hasRyanmen = tile3m.waitTypes.includes(WaitType.RYANMEN);
    const hasPenchan = tile3m.waitTypes.includes(WaitType.PENCHAN);
    console.log(`3m待ちの詳細:`);
    console.log(`  リャンメン: ${hasRyanmen}`);
    console.log(`  ペンチャン: ${hasPenchan}`);
    console.log(`  両方含む: ${hasRyanmen && hasPenchan}\n`);
  }

  // テストケース2: 6m待ちも確認
  const tile6m = result1.waitingTiles.find(info => info.tile.toString() === '6m');
  if (tile6m) {
    console.log(`6m待ちの詳細:`);
    console.log(`  待ちタイプ: [${tile6m.waitTypes.join(', ')}]`);
    console.log(`  期待: リャンメンのみ\n`);
  }

  // テストケース3: より複雑なケース - 1234567m
  console.log('テストケース2: 1234567m で複数の待ち');
  console.log('期待: 複数の牌で異なる待ちタイプの組み合わせ');
  
  const tiles2 = [
    ...HandParser.parseHandString('1234567m'),
    ...HandParser.parseHandString('999s'),     // 完成面子
    ...HandParser.parseHandString('11z')       // 東東（完成対子）
  ];
  
  const hand2 = Hand.create(tiles2, [], { drawnTile: null });
  const result2 = analyzer.analyzeWaitTypes(hand2);
  
  console.log('結果:');
  for (const waitInfo of result2.waitingTiles) {
    console.log(`  ${waitInfo.tile}: [${waitInfo.waitTypes.join(', ')}]`);
  }
  console.log(`複数の待ちタイプ: ${result2.hasMultipleWaitTypes}\n`);

  // テストケース4: 実際に3mを自摸した場合の和了分析
  console.log('テストケース3: 12345m で 3m 自摸時の分析');
  
  const hand3 = Hand.create(tiles1, [], { 
    drawnTile: '3m',
    isTsumo: true 
  });
  
  const winResult = analyzer.analyzeWinning(hand3);
  console.log(`和了: ${winResult.isWinning}`);
  
  if (winResult.isWinning && winResult.winningInfo) {
    console.log(`和了牌の待ちタイプ: [${winResult.winningInfo.waitTypes.join(', ')}]`);
    console.log(`面子構成数: ${winResult.winningInfo.compositions.length}`);
    
    // 各面子構成での待ちタイプを確認
    winResult.winningInfo.compositions.forEach((comp, index) => {
      console.log(`  構成${index + 1}:`);
      comp.components.forEach(component => {
        console.log(`    ${component.type}: [${component.tiles.map(t => t.toString()).join('')}]`);
      });
    });
  }
  
  console.log('\n=== テスト完了 ===');
}

// 面子分解の詳細を確認するヘルパー関数
function analyzeDecompositionDetails() {
  console.log('\n=== 面子分解詳細分析 ===');
  
  const analyzer = new HandAnalyzer();
  
  // 12345m + 完成形でのシャンテン計算結果を直接確認
  const tiles = [
    ...HandParser.parseHandString('12345m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z')
  ];
  
  const hand = Hand.create(tiles, [], { drawnTile: null });
  const progress = analyzer.analyzeHandProgress(hand);
  
  console.log(`シャンテン数: ${progress.shanten}`);
  console.log(`テンパイ: ${progress.isTenpai}`);
  console.log(`有効牌: [${progress.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  
  // 面子構成の詳細
  if (progress.mentsuCompositions) {
    console.log(`面子構成パターン数: ${progress.mentsuCompositions.length}`);
    progress.mentsuCompositions.forEach((comp, index) => {
      console.log(`  パターン${index + 1}:`);
      comp.components.forEach(component => {
        console.log(`    ${component.type}: [${component.tiles.map(t => t.toString()).join('')}]`);
      });
    });
  }
}

// テスト実行
testMultipleDecompositionWaitTypes();
analyzeDecompositionDetails();
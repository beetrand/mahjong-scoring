// 新しいHandAnalyzerのテスト

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import type { Wind } from '../common/types';

function testNewHandAnalyzer(): void {
  console.log('=== 新しいHandAnalyzerテスト ===\n');
  
  const analyzer = new HandAnalyzer();
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 2 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: false
  };
  
  // テスト1: 単騎待ち（雀頭完成）
  console.log('1. 単騎待ち（雀頭完成）');
  const tiles1 = [
    new Tile('1m'), new Tile('1m'), new Tile('1m'),
    new Tile('4p'), new Tile('5p'), new Tile('6p'),
    new Tile('7s'), new Tile('8s'), new Tile('9s'),
    new Tile('2z'), new Tile('2z'), new Tile('2z'),
    new Tile('1z'), new Tile('1z')  // 雀頭
  ];
  
  const hand1 = Hand.create(tiles1, [], {
    drawnTile: '1z',
    isTsumo: true,
    gameContext
  });
  
  const analysis1 = analyzer.analyzeWinning(hand1);
  console.log(`  和了: ${analysis1.isWinning}`);
  if (analysis1.winningInfo) {
    console.log(`  和了牌: ${analysis1.winningInfo.winningTile.toString()}`);
    console.log(`  待ちタイプ: ${analysis1.winningInfo.waitTypes.join(', ')}`);
    console.log(`  面子構成数: ${analysis1.winningInfo.compositions.length}`);
  }
  
  // テスト2: 両面待ち（順子完成）
  console.log('\n2. 両面待ち（順子完成）');
  const tiles2 = [
    new Tile('1m'), new Tile('2m'), new Tile('3m'),
    new Tile('4p'), new Tile('5p'), new Tile('6p'),
    new Tile('7s'), new Tile('8s'), new Tile('9s'),
    new Tile('2z'), new Tile('2z'),
    new Tile('3m'), new Tile('4m'), new Tile('5m')  // 345mの順子
  ];
  
  const hand2 = Hand.create(tiles2, [], {
    drawnTile: '5m',
    isTsumo: true,
    gameContext
  });
  
  const analysis2 = analyzer.analyzeWinning(hand2);
  console.log(`  和了: ${analysis2.isWinning}`);
  if (analysis2.winningInfo) {
    console.log(`  和了牌: ${analysis2.winningInfo.winningTile.toString()}`);
    console.log(`  待ちタイプ: ${analysis2.winningInfo.waitTypes.join(', ')}`);
    
    // 面子構成の詳細表示
    analysis2.winningInfo.compositions.forEach((comp, i) => {
      console.log(`  構成${i+1}:`);
      console.log(`    手牌タイプ: ${comp.handType}`);
      console.log(`    和了牌位置: 面子${comp.winningTilePosition.componentIndex}, 位置${comp.winningTilePosition.positionInComponent}`);
      const winningComponent = comp.components[comp.winningTilePosition.componentIndex];
      console.log(`    該当面子: ${winningComponent.type} [${winningComponent.tiles.map(t => t.toString()).join(' ')}]`);
    });
  }
  
  // テスト3: 嵌張待ち（順子完成）
  console.log('\n3. 嵌張待ち（順子完成）');
  const tiles3 = [
    new Tile('1m'), new Tile('1m'), new Tile('1m'),
    new Tile('4p'), new Tile('5p'), new Tile('6p'),
    new Tile('7s'), new Tile('8s'), new Tile('9s'),
    new Tile('2z'), new Tile('2z'),
    new Tile('1s'), new Tile('3s'), new Tile('2s')  // 123sの順子（2sが嵌張）
  ];
  
  const hand3 = Hand.create(tiles3, [], {
    drawnTile: '2s',
    isTsumo: true,
    gameContext
  });
  
  const analysis3 = analyzer.analyzeWinning(hand3);
  console.log(`  和了: ${analysis3.isWinning}`);
  if (analysis3.winningInfo) {
    console.log(`  和了牌: ${analysis3.winningInfo.winningTile.toString()}`);
    console.log(`  待ちタイプ: ${analysis3.winningInfo.waitTypes.join(', ')}`);
  }
  
  // テスト4: テンパイ分析（自摸なし）
  console.log('\n4. テンパイ分析（自摸なし）');
  const tiles4 = [
    new Tile('1m'), new Tile('1m'), new Tile('1m'),
    new Tile('4p'), new Tile('5p'), new Tile('6p'),
    new Tile('7s'), new Tile('8s'), new Tile('9s'),
    new Tile('2z'), new Tile('2z'), new Tile('2z'),
    new Tile('1z')  // 単騎待ち
  ];
  
  const hand4 = Hand.create(tiles4, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  const progress = analyzer.analyzeHandProgress(hand4);
  console.log(`  テンパイ: ${progress.isTenpai}`);
  console.log(`  シャンテン数: ${progress.shanten}`);
  if (progress.isTenpai) {
    console.log(`  待ち牌: ${progress.effectiveTiles.map(t => t.toString()).join(', ')}`);
    console.log('  手牌タイプ別待ち牌:');
    for (const [handType, tiles] of progress.effectiveTilesByHandType) {
      console.log(`    ${handType}: ${tiles.map(t => t.toString()).join(', ')}`);
    }
  }
  
  // テスト5: 待ちタイプ分析
  console.log('\n5. 待ちタイプ分析（複数待ち）');
  const tiles5 = [
    new Tile('1m'), new Tile('2m'), new Tile('3m'),
    new Tile('2m'), new Tile('3m'), new Tile('4m'),
    new Tile('7s'), new Tile('8s'), new Tile('9s'),
    new Tile('2z'), new Tile('2z'), new Tile('2z'),
    new Tile('4m')  // 14m待ち（両面待ち）
  ];
  
  const hand5 = Hand.create(tiles5, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  const waitTypeAnalysis = analyzer.analyzeWaitTypes(hand5);
  console.log(`  複数の待ちタイプ: ${waitTypeAnalysis.hasMultipleWaitTypes}`);
  console.log('  待ち牌詳細:');
  waitTypeAnalysis.waitingTiles.forEach(info => {
    console.log(`    ${info.tile.toString()}: ${info.waitTypes.join(', ')}`);
  });
}

// テスト実行
testNewHandAnalyzer();
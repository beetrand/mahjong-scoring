// ツモ牌位置分析のテスト

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import type { Wind } from '../common/types';

function testTsumoPosition(): void {
  console.log('=== ツモ牌位置分析テスト ===\n');
  
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
  if (analysis1.tsumoAnalysis) {
    console.log(`  ツモ牌: ${analysis1.tsumoAnalysis.tsumoTile.toString()}`);
    console.log(`  位置数: ${analysis1.tsumoAnalysis.positions.length}`);
    console.log(`  待ちタイプ: ${analysis1.tsumoAnalysis.waitTypes.join(', ')}`);
    
    analysis1.tsumoAnalysis.positions.forEach((pos, i) => {
      console.log(`    位置${i+1}: 構成${pos.compositionIndex}-面子${pos.componentIndex}-位置${pos.positionInComponent} (${pos.waitType})`);
    });
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
  if (analysis2.tsumoAnalysis) {
    console.log(`  ツモ牌: ${analysis2.tsumoAnalysis.tsumoTile.toString()}`);
    console.log(`  位置数: ${analysis2.tsumoAnalysis.positions.length}`);
    console.log(`  待ちタイプ: ${analysis2.tsumoAnalysis.waitTypes.join(', ')}`);
    
    analysis2.tsumoAnalysis.positions.forEach((pos, i) => {
      console.log(`    位置${i+1}: 構成${pos.compositionIndex}-面子${pos.componentIndex}-位置${pos.positionInComponent} (${pos.waitType})`);
      console.log(`      Component: ${pos.component.type} [${pos.component.tiles.map(t => t.toString()).join(' ')}]`);
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
  if (analysis3.tsumoAnalysis) {
    console.log(`  ツモ牌: ${analysis3.tsumoAnalysis.tsumoTile.toString()}`);
    console.log(`  位置数: ${analysis3.tsumoAnalysis.positions.length}`);
    console.log(`  待ちタイプ: ${analysis3.tsumoAnalysis.waitTypes.join(', ')}`);
    
    analysis3.tsumoAnalysis.positions.forEach((pos, i) => {
      console.log(`    位置${i+1}: 構成${pos.compositionIndex}-面子${pos.componentIndex}-位置${pos.positionInComponent} (${pos.waitType})`);
      console.log(`      Component: ${pos.component.type} [${pos.component.tiles.map(t => t.toString()).join(' ')}]`);
    });
  }
  
  // テスト4: 複数位置（同じ牌が複数箇所）
  console.log('\n4. 複数位置（同じ牌が複数箇所）');
  const tiles4 = [
    new Tile('1m'), new Tile('1m'), new Tile('1m'),  // 111m刻子
    new Tile('4p'), new Tile('5p'), new Tile('6p'),
    new Tile('7s'), new Tile('8s'), new Tile('9s'),
    new Tile('2z'), new Tile('2z'),
    new Tile('1m'), new Tile('2m'), new Tile('3m')   // 123m順子
  ];
  
  const hand4 = Hand.create(tiles4, [], {
    drawnTile: '1m',  // 1mが刻子と順子の両方にある
    isTsumo: true,
    gameContext
  });
  
  const analysis4 = analyzer.analyzeWinning(hand4);
  console.log(`  和了: ${analysis4.isWinning}`);
  if (analysis4.tsumoAnalysis) {
    console.log(`  ツモ牌: ${analysis4.tsumoAnalysis.tsumoTile.toString()}`);
    console.log(`  位置数: ${analysis4.tsumoAnalysis.positions.length}`);
    console.log(`  待ちタイプ: ${analysis4.tsumoAnalysis.waitTypes.join(', ')}`);
    
    analysis4.tsumoAnalysis.positions.forEach((pos, i) => {
      console.log(`    位置${i+1}: 構成${pos.compositionIndex}-面子${pos.componentIndex}-位置${pos.positionInComponent} (${pos.waitType})`);
      console.log(`      Component: ${pos.component.type} [${pos.component.tiles.map(t => t.toString()).join(' ')}]`);
    });
  }
  
  console.log('\nテスト完了！');
}

// テスト実行
testTsumoPosition();
// 簡単な和了判定デバッグ

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';

function debugWinningSimple() {
  console.log('=== 簡単な和了判定デバッグ ===\n');
  
  const analyzer = new HandAnalyzer();

  // 正しいテンパイ形: 3面子 + 1塔子 + 1雀頭 = 13枚
  const tiles = [
    ...HandParser.parseHandString('12m'),     // 塔子（3m待ち）
    ...HandParser.parseHandString('456s'),    // 完成面子
    ...HandParser.parseHandString('789p'),    // 完成面子  
    ...HandParser.parseHandString('111z'),    // 完成面子（刻子）
    ...HandParser.parseHandString('22z')      // 雀頭
  ];
  
  console.log('手牌（13枚）:', tiles.map(t => t.toString()).join(''));
  console.log('牌数:', tiles.length);
  
  // テンパイ状態をチェック
  const tenpaiHand = Hand.create(tiles, [], { drawnTile: null });
  const progress = analyzer.analyzeHandProgress(tenpaiHand);
  
  console.log(`テンパイ: ${progress.isTenpai}`);
  console.log(`シャンテン数: ${progress.shanten}`);
  console.log(`有効牌: [${progress.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  console.log(`面子構成数: ${progress.mentsuCompositions?.length || 0}`);
  
  // 3mを自摸した場合
  console.log('\n--- 3m自摸時 ---');
  const tiles3m = [...tiles, HandParser.parseHandString('3m')[0]];
  const winningHand = Hand.create(tiles3m, [], { 
    drawnTile: '3m',
    isTsumo: true 
  });
  
  console.log('手牌（14枚）:', winningHand.getConcealedTiles().map(t => t.toString()).join(''));
  console.log('自摸牌:', winningHand.drawnTile?.toString());
  
  // 和了判定
  const isWin = analyzer.isWinning(winningHand);
  console.log(`和了判定: ${isWin}`);
  
  // 手牌進行分析（自摸抜き）
  const winProgress = analyzer.analyzeHandProgress(winningHand);
  console.log(`テンパイ（自摸抜き）: ${winProgress.isTenpai}`);
  console.log(`有効牌（自摸抜き）: [${winProgress.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  
  // 有効牌に3mが含まれているかチェック
  const has3m = winProgress.effectiveTiles.some(t => t.toString() === '3m');
  console.log(`有効牌に3mが含まれる: ${has3m}`);
  
  // 和了分析
  console.log('\n--- 和了分析 ---');
  const winResult = analyzer.analyzeWinning(winningHand);
  console.log(`和了: ${winResult.isWinning}`);
  
  if (winResult.isWinning && winResult.winningInfo) {
    console.log(`面子構成数: ${winResult.winningInfo.compositionsWithWaitTypes.length}`);
    
    winResult.winningInfo.compositionsWithWaitTypes.forEach((item, i) => {
      console.log(`\n構成${i + 1}: 待ちタイプ=${item.waitType}`);
      item.composition.components.forEach((comp, j) => {
        const tilesStr = comp.tiles.map(t => t.toString()).join('');
        console.log(`  ${j}: ${comp.type} [${tilesStr}]`);
      });
    });
  }
}

debugWinningSimple();
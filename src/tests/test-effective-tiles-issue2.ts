// ユーザー指摘の有効牌計算問題のテストケース2

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { EffectiveTilesCalculator } from '../tensuu/effective-tiles-calculator';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import type { Wind } from '../common/types';

function testEffectiveTilesIssue2(): void {
  console.log('=== 有効牌計算問題2のテスト ===\n');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 1 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  // 手牌: 5mr 5m 4p 4p 4p 5pr 6p 7p 7p 8p 9p 5s 6s
  const tiles = [
    new Tile('5mr'), new Tile('5m'), 
    new Tile('4p'), new Tile('4p'), new Tile('4p'), new Tile('5pr'), new Tile('6p'), 
    new Tile('7p'), new Tile('7p'), new Tile('8p'), new Tile('9p'),
    new Tile('5s'), new Tile('6s')
  ];
  
  const hand = Hand.create(tiles, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log('手牌:', hand.getConcealedTiles().map(t => t.toString()).join(' '));
  
  // シャンテン数を確認
  const shantenCalc = new ShantenCalculator();
  const shantenResult = shantenCalc.calculateShanten(hand);
  console.log('現在のシャンテン数:', shantenResult.shanten);
  console.log('手牌タイプ:', shantenResult.handType);
  
  // 有効牌を計算
  const calculator = new EffectiveTilesCalculator();
  const result = calculator.calculateEffectiveTiles(hand);
  
  console.log('計算された有効牌:', result.tiles.map(t => t.toString()).join(' '));
  
  // 期待値は 4s 7s のみ
  const expectedTiles = ['4s', '7s'];
  const actualTiles = result.tiles.map(t => t.toString()).sort();
  
  console.log('期待される有効牌:', expectedTiles.join(' '));
  console.log('実際の有効牌:', actualTiles.join(' '));
  
  // 6sで和了になるかテスト
  console.log('\n6s追加テスト:');
  const testTiles = hand.getConcealedTiles();
  testTiles.push(new Tile('6s'));
  
  const handWith6s = Hand.create(testTiles, [], {
    drawnTile: '6s',
    isTsumo: true,
    gameContext
  });
  
  const analyzer = new HandAnalyzer();
  const analysis = analyzer.analyzeWinning(handWith6s);
  
  console.log('6s追加後の手牌:', handWith6s.getConcealedTiles().map(t => t.toString()).join(' '));
  console.log('6sで和了できる:', analysis.isWinning);
  
  if (analysis.isWinning && analysis.winningInfo) {
    console.log('和了牌:', analysis.winningInfo.winningTile.toString());
    console.log('面子構成数:', analysis.winningInfo.compositionsWithWaitTypes.length);
  }
  
  // 4s, 7sでも和了になるかテスト
  console.log('\n4s追加テスト:');
  const testTiles4s = hand.getConcealedTiles();
  testTiles4s.push(new Tile('4s'));
  
  const handWith4s = Hand.create(testTiles4s, [], {
    drawnTile: '4s',
    isTsumo: true,
    gameContext
  });
  
  const analysis4s = analyzer.analyzeWinning(handWith4s);
  console.log('4s追加後の手牌:', handWith4s.getConcealedTiles().map(t => t.toString()).join(' '));
  console.log('4sで和了できる:', analysis4s.isWinning);
  
  console.log('\n7s追加テスト:');
  const testTiles7s = hand.getConcealedTiles();
  testTiles7s.push(new Tile('7s'));
  
  const handWith7s = Hand.create(testTiles7s, [], {
    drawnTile: '7s',
    isTsumo: true,
    gameContext
  });
  
  const analysis7s = analyzer.analyzeWinning(handWith7s);
  console.log('7s追加後の手牌:', handWith7s.getConcealedTiles().map(t => t.toString()).join(' '));
  console.log('7sで和了できる:', analysis7s.isWinning);
  
  // 詳細分析
  console.log('\n詳細分析:');
  const handTileCount = hand.getTileCount(false);
  console.log('現在の牌カウント:', handTileCount.toString());
  
  // 各牌を追加した場合のシャンテン数
  const testCandidates = ['4s', '6s', '7s'];
  
  for (const candidateStr of testCandidates) {
    const candidate = new Tile(candidateStr);
    const testTileCount = handTileCount.clone();
    testTileCount.addTile(candidate);
    
    const regularShanten = shantenCalc.calculateRegularShanten(testTileCount, 0).shanten;
    const chitoitsuShanten = shantenCalc.calculateChitoitsuShanten(testTileCount, false);
    const kokushiShanten = shantenCalc.calculateKokushiShanten(testTileCount, false);
    
    const finalShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
    
    console.log(`${candidateStr}追加後: ${finalShanten}シャンテン (通常${regularShanten}, 七対${chitoitsuShanten}, 国士${kokushiShanten})`);
  }
}

// テスト実行
testEffectiveTilesIssue2();
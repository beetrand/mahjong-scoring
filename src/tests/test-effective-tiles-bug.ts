// ユーザー指摘の有効牌計算バグのテストケース

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { EffectiveTilesCalculator } from '../tensuu/effective-tiles-calculator';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import type { Wind } from '../common/types';

function testEffectiveTilesBug(): void {
  console.log('=== 有効牌計算バグテスト ===\n');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 1 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  // ユーザー指摘の例: 3m 3m 5mr 6m 3p 5pr 7p 8p 9p 4s 4s 4s + 4m
  // 有効牌は 4p のみであるべき（4m 7m 4p ではない）
  const tiles = [
    new Tile('3m'), new Tile('3m'), new Tile('5mr'), new Tile('6m'),
    new Tile('3p'), new Tile('5pr'), new Tile('7p'), new Tile('8p'), new Tile('9p'),
    new Tile('4s'), new Tile('4s'), new Tile('4s'),
    new Tile('4m')  // 自摸牌も含む
  ];
  
  const hand = Hand.create(tiles, [], {
    drawnTile: '4m',  // 自摸牌
    isTsumo: true,
    gameContext
  });
  
  console.log('手牌（自摸牌除く）:', hand.getTehai(true).map(t => t.toString()).join(' '));
  console.log('自摸牌:', hand.drawnTile?.toString());
  
  const calculator = new EffectiveTilesCalculator();
  const result = calculator.calculateEffectiveTiles(hand);
  
  console.log('現在のシャンテン数:', result.currentShanten);
  console.log('計算された有効牌:', result.tiles.map(t => t.toString()).join(' '));
  
  // 期待値は 4p のみ
  const expectedTiles = ['4p'];
  const actualTiles = result.tiles.map(t => t.toString()).sort();
  
  console.log('期待される有効牌:', expectedTiles.join(' '));
  console.log('実際の有効牌:', actualTiles.join(' '));
  
  const isCorrect = actualTiles.length === expectedTiles.length && 
                   actualTiles.every((tile, index) => tile === expectedTiles[index]);
  
  console.log('テスト結果:', isCorrect ? '✓ 正しい' : '✗ 間違い');
  
  if (!isCorrect) {
    console.log('\n問題分析:');
    
    // 手牌の牌カウントを確認
    console.log('getTileCount(true) - 自摸牌除外:', hand.getTileCount(true).toString());
    console.log('getTileCount(false) - 自摸牌含む:', hand.getTileCount(false).toString());
    
    // 最適な捨牌を分析
    console.log('\n各捨牌のシャンテン数分析:');
    const allTiles = hand.getConcealedTiles();
    let bestShanten = Infinity;
    
    for (const discardTile of allTiles) {
      const tileCountAfterDiscard = hand.getTileCount(false).clone();
      tileCountAfterDiscard.removeTile(discardTile);
      
      const shantenCalc = new ShantenCalculator();
      const regularShanten = shantenCalc.calculateRegularShanten(tileCountAfterDiscard, 0).shanten;
      const chitoitsuShanten = shantenCalc.calculateChitoitsuShanten(tileCountAfterDiscard, false);
      const kokushiShanten = shantenCalc.calculateKokushiShanten(tileCountAfterDiscard, false);
      
      const minShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
      console.log(`${discardTile.toString()} 捨牌後: ${minShanten}シャンテン (通常${regularShanten}, 七対${chitoitsuShanten}, 国士${kokushiShanten})`);
      
      bestShanten = Math.min(bestShanten, minShanten);
    }
    
    console.log(`最適捨牌後のシャンテン数: ${bestShanten}`);
    
    // 各有効牌候補を手動で確認
    console.log('\n各牌を追加した場合のシャンテン数詳細:');
    const testTiles = ['3m', '4p', '6m'];
    
    for (const testTileStr of testTiles) {
      console.log(`\n${testTileStr} の詳細分析:`);
      
      // 最適捨牌を見つける
      let bestDiscardShanten = Infinity;
      let bestTileCountAfterDiscard: any = null;
      
      for (const discardTile of allTiles) {
        const tileCountAfterDiscard = hand.getTileCount(false).clone();
        tileCountAfterDiscard.removeTile(discardTile);
        
        const shantenCalc = new ShantenCalculator();
        const regularShanten = shantenCalc.calculateRegularShanten(tileCountAfterDiscard, 0).shanten;
        const chitoitsuShanten = shantenCalc.calculateChitoitsuShanten(tileCountAfterDiscard, false);
        const kokushiShanten = shantenCalc.calculateKokushiShanten(tileCountAfterDiscard, false);
        
        const minShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
        
        if (minShanten < bestDiscardShanten) {
          bestDiscardShanten = minShanten;
          bestTileCountAfterDiscard = tileCountAfterDiscard;
        }
      }
      
      // この最適状態に testTile を加える
      const testTile = new Tile(testTileStr);
      const testTileCount = bestTileCountAfterDiscard.clone();
      testTileCount.addTile(testTile);
      
      const shantenCalc = new ShantenCalculator();
      const regularShanten = shantenCalc.calculateRegularShanten(testTileCount, 0).shanten;
      const chitoitsuShanten = shantenCalc.calculateChitoitsuShanten(testTileCount, false);
      const kokushiShanten = shantenCalc.calculateKokushiShanten(testTileCount, false);
      
      const finalShanten = Math.min(regularShanten, chitoitsuShanten, kokushiShanten);
      
      console.log(`  最適捨牌後のベース: ${bestDiscardShanten}シャンテン`);
      console.log(`  ${testTileStr}追加後: ${finalShanten}シャンテン (通常${regularShanten}, 七対${chitoitsuShanten}, 国士${kokushiShanten})`);
      console.log(`  改善: ${finalShanten < bestDiscardShanten ? 'あり' : 'なし'}`);
    }
  }
}

// テスト実行
testEffectiveTilesBug();
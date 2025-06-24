import { Hand } from '../common/hand';
import { TileGenerator } from '../common/tile-generator';
import type { Wind } from '../common/types';

function testRandomHandOperations(): void {
  console.log('=== ランダム手牌テスト ===\n');

  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 2 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };

  // テスト実行回数
  const testCount = 5;

  for (let i = 0; i < testCount; i++) {
    console.log(`\n--- テスト ${i + 1} ---`);
    
    // 1. ランダム手牌を生成
    const randomTiles = TileGenerator.generateRandomHand(13);
    console.log('初期手牌:', randomTiles.map(t => t.toString()).join(' '));
    
    // 2. 手牌オブジェクトを作成
    const hand = Hand.create(randomTiles, [], {
      drawnTile: null,
      isTsumo: false,
      gameContext
    });
    
    console.log(`手牌枚数: ${hand.getConcealedTileCount()}枚`);
    
    // 3. 山牌を作成（手牌の牌は除外）
    const mountain = TileGenerator.createMountain(randomTiles);
    console.log(`山牌残り: ${mountain.length}枚`);
    
    // 4. ランダムに自摸
    const drawnTile = TileGenerator.drawFromMountain(mountain);
    if (drawnTile) {
      console.log(`自摸牌: ${drawnTile.toString()}`);
      hand.draw(drawnTile);
      console.log(`自摸後手牌: ${hand.getConcealedTiles().map(t => t.toString()).join(' ')}`);
      console.log(`手牌枚数: ${hand.getConcealedTileCount()}枚 (ツモ牌: ${hand.drawnTile?.toString() || 'なし'})`);
    }
    
    // 5. ランダムに牌を選択して捨牌
    const handTiles = hand.getConcealedTiles();
    if (handTiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * handTiles.length);
      const tileToDiscard = handTiles[randomIndex];
      
      console.log(`捨牌選択: ${tileToDiscard.toString()} (${randomIndex + 1}番目)`);
      hand.discard(tileToDiscard);
      
      console.log(`捨牌後手牌: ${hand.getConcealedTiles().map(t => t.toString()).join(' ')}`);
      console.log(`手牌枚数: ${hand.getConcealedTileCount()}枚 (ツモ牌: ${hand.drawnTile?.toString() || 'なし'})`);
    }
    
    // 6. 牌の種類をカウント
    const tileCount = hand.getTileCount();
    console.log('牌種別カウント:', {
      萬子: tileCount.getManCounts().join(''),
      筒子: tileCount.getPinCounts().join(''),
      索子: tileCount.getSouCounts().join(''),
      字牌: tileCount.getHonorCounts().join('')
    });
  }
  
  console.log('\n=== 大量テスト（統計情報） ===');
  
  // 統計情報収集
  const stats = {
    totalTests: 100,
    redDoraCount: 0,
    honorTileCount: 0,
    terminalTileCount: 0
  };
  
  for (let i = 0; i < stats.totalTests; i++) {
    const tiles = TileGenerator.generateRandomHand(13);
    
    tiles.forEach(tile => {
      if (tile.isRed) stats.redDoraCount++;
      if (tile.isHonor()) stats.honorTileCount++;
      if (tile.isTerminal()) stats.terminalTileCount++;
    });
  }
  
  console.log(`${stats.totalTests}回のテスト結果:`);
  console.log(`- 赤ドラ出現回数: ${stats.redDoraCount} (平均: ${(stats.redDoraCount / stats.totalTests).toFixed(2)}回/手牌)`);
  console.log(`- 字牌出現回数: ${stats.honorTileCount} (平均: ${(stats.honorTileCount / stats.totalTests).toFixed(2)}枚/手牌)`);
  console.log(`- 么九牌出現回数: ${stats.terminalTileCount} (平均: ${(stats.terminalTileCount / stats.totalTests).toFixed(2)}枚/手牌)`);
  
  console.log('\nテスト完了！');
}

// 特定パターンテスト
function testSpecificPattern(): void {
  console.log('\n=== 特定パターンテスト ===');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 2 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  // 手動で特定の手牌を作成
  const specificTiles = TileGenerator.generateRandomHand(13);
  console.log('テスト手牌:', specificTiles.map(t => t.toString()).join(' '));
  
  const hand = Hand.create(specificTiles, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  // 複数回自摸と捨牌を繰り返す
  const mountain = TileGenerator.createMountain(specificTiles);
  
  for (let turn = 1; turn <= 3; turn++) {
    console.log(`\n-- ターン ${turn} --`);
    
    // 自摸
    const drawnTile = TileGenerator.drawFromMountain(mountain);
    if (drawnTile) {
      hand.draw(drawnTile);
      console.log(`自摸: ${drawnTile.toString()}`);
      console.log(`手牌: ${hand.getConcealedTiles().map(t => t.toString()).join(' ')}`);
      
      // ランダムに捨牌
      const tiles = hand.getConcealedTiles();
      const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
      hand.discard(randomTile);
      console.log(`捨牌: ${randomTile.toString()}`);
      console.log(`結果: ${hand.getConcealedTiles().map(t => t.toString()).join(' ')}`);
    }
  }
}

// テスト実行
testRandomHandOperations();
testSpecificPattern();

export { testRandomHandOperations, testSpecificPattern };
import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import type { Wind } from '../common/types';

function testHandSort(): void {
  console.log('=== 手牌ソートテスト ===\n');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 1 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  // テスト1: バラバラな手牌に自摸
  console.log('テスト1: バラバラな手牌に自摸');
  const tiles1 = [
    new Tile('9s'), new Tile('1m'), new Tile('5p'),
    new Tile('3z'), new Tile('2s'), new Tile('7m'),
    new Tile('1z'), new Tile('4p'), new Tile('8s'),
    new Tile('2m'), new Tile('6p'), new Tile('5z'),
    new Tile('3m')
  ];
  
  const hand1 = Hand.create(tiles1, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log('初期手牌:', hand1.tiles.map(t => t.toString()).join(' '));
  
  // 5mを自摸
  const drawTile1 = new Tile('5m');
  hand1.draw(drawTile1);
  console.log('5mを自摸後:', hand1.tiles.map(t => t.toString()).join(' '));
  console.log('ツモ牌:', hand1.drawnTile?.toString());
  
  // テスト2: 赤ドラを含む自摸
  console.log('\nテスト2: 赤ドラを含む自摸');
  const tiles2 = [
    new Tile('1m'), new Tile('2m'), new Tile('3m'),
    new Tile('4p'), new Tile('6p'), new Tile('7p'),
    new Tile('1s'), new Tile('2s'), new Tile('3s'),
    new Tile('1z'), new Tile('1z'), new Tile('2z'),
    new Tile('2z')
  ];
  
  const hand2 = Hand.create(tiles2, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log('初期手牌:', hand2.tiles.map(t => t.toString()).join(' '));
  
  // 赤5pを自摸
  const drawTile2 = new Tile('5pr');
  hand2.draw(drawTile2);
  console.log('赤5pを自摸後:', hand2.tiles.map(t => t.toString()).join(' '));
  console.log('ツモ牌:', hand2.drawnTile?.toString());
  
  // テスト3: 連続自摸
  console.log('\nテスト3: 連続自摸と捨牌');
  const tiles3 = [
    new Tile('1m'), new Tile('1m'), new Tile('1m'),
    new Tile('2p'), new Tile('3p'), new Tile('4p'),
    new Tile('5s'), new Tile('6s'), new Tile('7s'),
    new Tile('1z'), new Tile('1z'), new Tile('2z'),
    new Tile('2z')
  ];
  
  const hand3 = Hand.create(tiles3, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log('初期手牌:', hand3.tiles.map(t => t.toString()).join(' '));
  
  // 9mを自摸
  hand3.draw(new Tile('9m'));
  console.log('9mを自摸後:', hand3.tiles.map(t => t.toString()).join(' '));
  
  // 9mを捨てる
  hand3.discard(new Tile('9m'));
  console.log('9mを捨牌後:', hand3.tiles.map(t => t.toString()).join(' '));
  
  // 8sを自摸
  hand3.draw(new Tile('8s'));
  console.log('8sを自摸後:', hand3.tiles.map(t => t.toString()).join(' '));
  
  console.log('\nテスト完了！');
}

// テスト実行
testHandSort();

export { testHandSort };
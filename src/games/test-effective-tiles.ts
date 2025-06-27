import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { EffectiveTilesCalculator } from '../tensuu/effective-tiles-calculator';
import type { Wind } from '../common/types';

// 有効牌表示テスト
function testEffectiveTilesDisplay() {
  console.log('=== 有効牌表示テスト ===\n');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 1 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  const effectiveCalculator = new EffectiveTilesCalculator();
  
  // テストケース1: 両面待ちに近い形
  console.log('テスト1: 両面待ちに近い形');
  const tiles1 = [
    new Tile('1m'), new Tile('2m'), new Tile('3m'),
    new Tile('4p'), new Tile('5p'), new Tile('6p'),
    new Tile('7s'), new Tile('8s'), // 9sで順子完成
    new Tile('1z'), new Tile('1z'), new Tile('2z'),
    new Tile('3z'), new Tile('4z')
  ];
  
  const hand1 = Hand.create(tiles1, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log('手牌:', tiles1.map(t => t.toString()).join(' '));
  
  const effective1 = effectiveCalculator.calculateEffectiveTiles(hand1);
  console.log('有効牌:', effective1.tiles.map(t => t.toString()).join(' '));
  
  // テストケース2: 対子手に近い形
  console.log('\nテスト2: 対子手に近い形');
  const tiles2 = [
    new Tile('1m'), new Tile('1m'),
    new Tile('3p'), new Tile('3p'),
    new Tile('5s'), new Tile('5s'),
    new Tile('7m'), new Tile('7m'),
    new Tile('9p'), new Tile('9p'),
    new Tile('1z'), new Tile('1z'),
    new Tile('2z')
  ];
  
  const hand2 = Hand.create(tiles2, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log('手牌:', tiles2.map(t => t.toString()).join(' '));
  
  const effective2 = effectiveCalculator.calculateEffectiveTiles(hand2);
  console.log('有効牌:', effective2.tiles.map(t => t.toString()).join(' '));
  
  // 色付き表示のテスト
  console.log('\n色付き表示テスト:');
  const formatTile = (tile: Tile): string => {
    const str = tile.toString();
    
    if (tile.isRed) {
      return `\x1b[31m${str}\x1b[0m`;
    }
    
    if (tile.suit === 'man') {
      return `\x1b[31m${str}\x1b[0m`;
    } else if (tile.suit === 'pin') {
      return `\x1b[34m${str}\x1b[0m`;
    } else if (tile.suit === 'sou') {
      return `\x1b[32m${str}\x1b[0m`;
    }
    
    return str;
  };
  
  console.log('有効牌（色付き）:', effective1.tiles.map(formatTile).join(' '));
}

// テスト実行
testEffectiveTilesDisplay();
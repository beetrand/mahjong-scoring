// 面子詳細情報テスト

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import { indexToTileName } from '../common/tile-constants';

// テスト用のHandオブジェクトを作成
function createTestHand(tileStr: string): Hand {
  const tiles = Tile.parseHandString(tileStr);
  const mockGameContext = {
    roundWind: 1 as any,
    playerWind: 1 as any,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: false
  };
  
  return new Hand(tiles, {
    drawnTile: tiles[tiles.length - 1].toString(),
    isTsumo: true,
    gameContext: mockGameContext,
    openMelds: []
  });
}


// 残り牌の表示（対子・搭子・孤立牌）
function displayRemainingTiles(tiles: any): string {
  const remaining = [];
  
  // 対子の検出
  for (let i = 0; i < 34; i++) {
    const count = tiles.getCount(i);
    if (count >= 2) {
      const tileName = indexToTileName(i);
      remaining.push(`${tileName}${tileName}(対子)`);
      tiles.decrement(i, 2);
    }
  }
  
  // 数牌の搭子の検出
  for (let suit = 0; suit < 3; suit++) {
    const start = suit * 9;
    
    // 隣接搭子
    for (let i = start; i < start + 8; i++) {
      const count1 = tiles.getCount(i);
      const count2 = tiles.getCount(i + 1);
      if (count1 > 0 && count2 > 0) {
        const tileName1 = indexToTileName(i);
        const tileName2 = indexToTileName(i + 1);
        remaining.push(`${tileName1}${tileName2}(搭子)`);
        tiles.decrement(i);
        tiles.decrement(i + 1);
      }
    }
    
    // 飛び搭子
    for (let i = start; i < start + 7; i++) {
      const count1 = tiles.getCount(i);
      const count3 = tiles.getCount(i + 2);
      if (count1 > 0 && count3 > 0) {
        const tileName1 = indexToTileName(i);
        const tileName3 = indexToTileName(i + 2);
        remaining.push(`${tileName1}${tileName3}(搭子)`);
        tiles.decrement(i);
        tiles.decrement(i + 2);
      }
    }
  }
  
  // 残りの孤立牌
  for (let i = 0; i < 34; i++) {
    const count = tiles.getCount(i);
    if (count > 0) {
      const tileName = indexToTileName(i);
      remaining.push(`${tileName.repeat(count)}(孤立)`);
    }
  }
  
  return remaining.join(' ');
}

function testMentsuDetails() {
  console.log('=== 面子詳細情報テスト ===\n');

  const testCases = [
    {
      name: '基本和了形（111222333m4455s）',
      tiles: '111222333m4455s',
      description: '刻子3つ + 刻子 + 雀頭'
    },
    {
      name: '順子混合（123456789m1122s）',
      tiles: '123456789m1122s',
      description: '順子3つ + 対子 + 雀頭'
    },
    {
      name: '混合形（111234555m1122s）',
      tiles: '111234555m1122s',
      description: '刻子 + 順子 + 刻子 + 対子 + 雀頭'
    },
    {
      name: 'テンパイ形（2345666m123p456s）',
      tiles: '2345666m123p456s',
      description: '順子 + 搭子 + 対子 + 順子 + 順子 = 0シャンテン'
    }
  ];

  const calculator = new ShantenCalculator();

  testCases.forEach(testCase => {
    console.log(`\nテスト: ${testCase.name}`);
    console.log(`手牌: ${testCase.tiles}`);
    console.log(`説明: ${testCase.description}`);
    
    const hand = createTestHand(testCase.tiles);
    
    // 詳細情報付きでシャンテン数を計算
    const result = calculator.calculateRegularShanten(hand, true);
    
    console.log(`シャンテン数: ${result.shanten}`);
    console.log(`詳細パターン数: ${result.details?.length || 0}`);
    
    if (result.details && result.details.length > 0) {
      result.details.forEach((detail, index) => {
        console.log(`\n  パターン ${index + 1}:`);
        console.log(`    面子数: ${detail.mentsuList.length}`);
        
        detail.mentsuList.forEach((component, mentsuIndex) => {
          console.log(`    面子${mentsuIndex + 1}: ${component.toString()}`);
        });
        
        // 残り牌の表示
        const remainingDisplay = displayRemainingTiles(detail.remainingTiles.clone());
        if (remainingDisplay) {
          console.log(`    残り牌: ${remainingDisplay}`);
        }
      });
    }
  });
}

// テスト実行
testMentsuDetails();

export { testMentsuDetails };
// 面子詳細情報テスト

import { Hand } from '../common/hand';
import { HandParser } from '../common/hand-parser';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import { ComponentType } from '../common/component';

// テスト用のHandオブジェクトを作成
function createTestHand(tileStr: string): Hand {
  const tiles = HandParser.parseHandString(tileStr);
  const mockGameContext = {
    roundWind: 1 as any,
    playerWind: 1 as any,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: false
  };
  
  return new Hand(tiles, [], {
    drawnTile: tiles[tiles.length - 1].toString(),
    isTsumo: true,
    gameContext: mockGameContext
  });
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
    const shantenResult = calculator.calculateShanten(hand);
    
    console.log(`シャンテン数: ${shantenResult.shanten}`);
    console.log(`手牌タイプ: ${shantenResult.handType}`);
    
    // 通常手の場合
    if (shantenResult.handType === 'regular' && shantenResult.optimalStates) {
      console.log(`詳細パターン数: ${shantenResult.optimalStates.length}`);
      
      shantenResult.optimalStates.forEach((state, index) => {
        console.log(`\n  パターン ${index + 1}:`);
        console.log(`    面子数: ${state.mentsuCount}, 対子数: ${state.toitsuCount}, 搭子数: ${state.taatsuCount}`);
        
        // 面子の表示
        const mentsu = state.components.filter(c => c.isCompleteMentsu());
        mentsu.forEach((component, mentsuIndex) => {
          console.log(`    面子${mentsuIndex + 1}: ${component.toString()}`);
        });
        
        // 対子の表示
        const pairs = state.components.filter(c => c.type === ComponentType.PAIR);
        pairs.forEach((component, pairIndex) => {
          console.log(`    対子${pairIndex + 1}: ${component.toString()}`);
        });
        
        // 搭子の表示
        const taatsu = state.components.filter(c => c.type === ComponentType.TAATSU);
        taatsu.forEach((component, taatsuIndex) => {
          console.log(`    搭子${taatsuIndex + 1}: ${component.toString()}`);
        });
      });
    }
    // 七対子・国士無双の場合（詳細分解は行わない）
    else {
      console.log(`${shantenResult.handType}手として計算済み`);
    }
  });
}

// テスト実行
testMentsuDetails();

export { testMentsuDetails };
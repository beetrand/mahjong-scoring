// テンパイ時の面子構成確認

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { ShantenCalculator } from './src/tensuu/shanten-calculator';

function debugTenpaiCompositions() {
  console.log('=== テンパイ時の面子構成確認 ===\n');
  
  const shantenCalculator = new ShantenCalculator();

  // 12345m で3m待ちの例（前述のテスト）
  console.log('ケース: 1245m456s789p11z (13枚)');
  
  const tiles = [
    ...HandParser.parseHandString('1245m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z')
  ];
  
  console.log(`手牌: ${tiles.map(t => t.toString()).join('')}`);
  console.log(`牌数: ${tiles.length}`);
  
  const hand = Hand.create(tiles, [], { drawnTile: null });
  const result = shantenCalculator.calculateShanten(hand, true);
  
  console.log(`\nシャンテン数: ${result.shanten}`);
  console.log(`手牌タイプ: ${result.handType}`);
  console.log(`面子構成数: ${result.optimalStates?.length || 0}`);
  
  if (result.optimalStates) {
    result.optimalStates.forEach((comp, i) => {
      console.log(`\n構成${i + 1}:`);
      comp.components.forEach((component, j) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`  ${j}: ${component.type} [${tilesStr}]`);
      });
    });
  }
  
  // 通常手で複数構成の確認
  console.log('\n\nケース: 123456m789p11z (13枚)');
  
  const tiles2 = [
    ...HandParser.parseHandString('123456m'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z')
  ];
  
  console.log(`手牌: ${tiles2.map(t => t.toString()).join('')}`);
  
  const hand2 = Hand.create(tiles2, [], { drawnTile: null });
  const result2 = shantenCalculator.calculateShanten(hand2, true);
  
  console.log(`\nシャンテン数: ${result2.shanten}`);
  console.log(`面子構成数: ${result2.optimalStates?.length || 0}`);
  
  if (result2.optimalStates) {
    result2.optimalStates.forEach((comp, i) => {
      console.log(`\n構成${i + 1}:`);
      comp.components.forEach((component, j) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`  ${j}: ${component.type} [${tilesStr}]`);
      });
    });
  }
}

debugTenpaiCompositions();
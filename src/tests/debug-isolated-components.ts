// 孤立牌の構成確認

import { Hand } from '../common/hand';
import { HandParser } from '../common/hand-parser';
import { ShantenCalculator } from '../tensuu/shanten-calculator';

function debugIsolatedComponents() {
  console.log('=== 孤立牌の構成確認 ===\n');
  
  const shantenCalculator = new ShantenCalculator();

  // 単騎待ちのケース: 111m222s333p444z5z
  console.log('ケース: 111m222s333p444z5z (13枚)');
  
  const tiles = [
    ...HandParser.parseHandString('111m'),
    ...HandParser.parseHandString('222s'),
    ...HandParser.parseHandString('333p'),
    ...HandParser.parseHandString('444z'),
    ...HandParser.parseHandString('5z')
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
}

debugIsolatedComponents();
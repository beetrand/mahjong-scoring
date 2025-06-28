// 待ちタイプ判定ロジックのデバッグ

import { Hand } from '../common/hand';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import { HandParser } from '../common/hand-parser';
import { WaitType } from '../common/types';
import { ShantenCalculator } from '../tensuu/shanten-calculator';

function debugWaitTypeLogic() {
  console.log('=== 待ちタイプ判定ロジックのデバッグ ===\n');
  
  // 12345m + 完成形
  const tiles = [
    ...HandParser.parseHandString('12345m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z')
  ];
  
  const hand = Hand.create(tiles, [], { drawnTile: null });
  
  // 3mを追加した場合の仮想手牌を作成
  const virtualTiles = [...hand.getConcealedTiles(), new (HandParser.parseHandString('3m')[0].constructor as any)('3m')];
  const virtualHand = Hand.create(virtualTiles, [], { 
    drawnTile: '3m', 
    isTsumo: true 
  });
  
  console.log('元の手牌:', hand.getConcealedTiles().map(t => t.toString()).join(''));
  console.log('3m追加後:', virtualHand.getConcealedTiles().map(t => t.toString()).join(''));
  
  // シャンテン計算で面子構成を確認
  const shantenCalculator = new ShantenCalculator();
  const result = shantenCalculator.calculateShanten(virtualHand, false);
  
  console.log(`シャンテン数: ${result.shanten}`);
  console.log(`面子構成数: ${result.optimalStates?.length || 0}`);
  
  if (result.optimalStates) {
    result.optimalStates.forEach((composition, index) => {
      console.log(`\n構成${index + 1}:`);
      composition.components.forEach((component, compIndex) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`  ${compIndex}: ${component.type} [${tilesStr}]`);
        
        // 3mがこの面子に含まれているか確認
        const tile3m = component.tiles.find(t => t.toString() === '3m');
        if (tile3m) {
          const position = component.tiles.findIndex(t => t.toString() === '3m');
          console.log(`    -> 3mの位置: ${position}`);
          
          // 待ちタイプを判定
          const waitType = determineWaitTypeFromComponentDebug(component, position);
          console.log(`    -> 待ちタイプ: ${waitType}`);
        }
      });
    });
  }
}

// デバッグ用の待ちタイプ判定関数
function determineWaitTypeFromComponentDebug(component: any, position: number): string {
  switch (component.type) {
    case 'pair':
      return 'TANKI';
    case 'triplet':
      return 'SHANPON';
    case 'sequence':
      if (component.tiles.length !== 3) return 'TANKI';
      
      const firstValue = component.tiles[0].value;
      const isTerminal = firstValue === 1 || firstValue === 7;
      
      console.log(`      firstValue: ${firstValue}, isTerminal: ${isTerminal}, position: ${position}`);
      
      if (position === 0) {
        const result = isTerminal && firstValue === 1 ? 'PENCHAN' : 'RYANMEN';
        console.log(`      position 0: ${result} (firstValue=${firstValue})`);
        return result;
      } else if (position === 2) {
        const result = isTerminal && firstValue === 7 ? 'PENCHAN' : 'RYANMEN';
        console.log(`      position 2: ${result} (firstValue=${firstValue})`);
        return result;
      } else {
        return 'KANCHAN';
      }
    default:
      return 'TANKI';
  }
}

debugWaitTypeLogic();
// シャンテン計算で複数構成が正しく返されるかデバッグ

import { Hand } from '../common/hand';
import { HandParser } from '../common/hand-parser';
import { ShantenCalculator } from '../tensuu/shanten-calculator';

function debugShantenCompositions() {
  console.log('=== シャンテン計算の複数構成デバッグ ===\n');
  
  const shantenCalculator = new ShantenCalculator();
  
  // テンパイ状態（12345m + 完成形）
  console.log('1. テンパイ状態の12345m:');
  const tenpaiTiles = [
    ...HandParser.parseHandString('12345m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z')
  ];
  
  const tenpaiHand = Hand.create(tenpaiTiles, [], { drawnTile: null });
  const tenpaiResult = shantenCalculator.calculateShanten(tenpaiHand, true);
  
  console.log(`シャンテン数: ${tenpaiResult.shanten}`);
  console.log(`構成数: ${tenpaiResult.optimalStates?.length || 0}`);
  
  if (tenpaiResult.optimalStates) {
    tenpaiResult.optimalStates.forEach((comp, i) => {
      console.log(`  構成${i + 1}:`);
      comp.components.forEach(component => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`    ${component.type}: [${tilesStr}]`);
      });
    });
  }
  
  console.log('\n2. 3m追加で和了状態:');
  
  // 3m追加後の和了状態
  const winTiles = [
    ...HandParser.parseHandString('123345m'),
    ...HandParser.parseHandString('456s'),
    ...HandParser.parseHandString('789p'),
    ...HandParser.parseHandString('11z')
  ];
  
  const winHand = Hand.create(winTiles, [], { 
    drawnTile: '3m',
    isTsumo: true 
  });
  
  // ツモ牌なしで計算（14枚で和了形チェック）
  const winResult = shantenCalculator.calculateShanten(winHand, false);
  
  console.log(`シャンテン数: ${winResult.shanten}`);
  console.log(`構成数: ${winResult.optimalStates?.length || 0}`);
  
  if (winResult.optimalStates) {
    winResult.optimalStates.forEach((comp, i) => {
      console.log(`  構成${i + 1}:`);
      comp.components.forEach(component => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`    ${component.type}: [${tilesStr}]`);
      });
    });
  }
  
  console.log('\n3. 手動で仮想手牌を作成（determineWaitTypesForTileの処理を再現）:');
  
  // determineWaitTypesForTileメソッドと同じ処理
  const virtualTiles = [...tenpaiHand.getConcealedTiles()];
  if (tenpaiHand.drawnTile) {
    const index = virtualTiles.findIndex(t => t.equals(tenpaiHand.drawnTile!));
    if (index >= 0) {
      virtualTiles.splice(index, 1);
    }
  }
  virtualTiles.push(HandParser.parseHandString('3m')[0]);
  
  const virtualHand = Hand.create(virtualTiles, tenpaiHand.openMelds, {
    drawnTile: '3m',
    isTsumo: true,
    gameContext: tenpaiHand.gameContext
  });
  
  console.log('仮想手牌の牌:', virtualHand.getConcealedTiles().map(t => t.toString()).join(''));
  
  const virtualResult = shantenCalculator.calculateShanten(virtualHand, false);
  
  console.log(`シャンテン数: ${virtualResult.shanten}`);
  console.log(`構成数: ${virtualResult.optimalStates?.length || 0}`);
  
  if (virtualResult.optimalStates) {
    virtualResult.optimalStates.forEach((comp, i) => {
      console.log(`  構成${i + 1}:`);
      comp.components.forEach(component => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`    ${component.type}: [${tilesStr}]`);
        
        // 3mの位置を確認
        const tile3m = component.tiles.find(t => t.toString() === '3m');
        if (tile3m) {
          const position = component.tiles.findIndex(t => t.toString() === '3m');
          console.log(`      -> 3mの位置: ${position}, firstValue: ${component.tiles[0].value}`);
        }
      });
    });
  }
}

debugShantenCompositions();
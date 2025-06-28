// テンパイ状態での面子分解詳細ログ

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { ShantenCalculator } from './src/tensuu/shanten-calculator';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';

function debugTenpaiDecomposition() {
  console.log('=== テンパイ状態での面子分解詳細ログ ===\n');
  
  // 12345m123456p11s (13枚、テンパイ状態)
  const tiles = [
    ...HandParser.parseHandString('12345m'),    // 5枚
    ...HandParser.parseHandString('123456p'),   // 6枚
    ...HandParser.parseHandString('11s')        // 2枚 = 計13枚
  ];
  
  console.log('手牌:', tiles.map(t => t.toString()).join(''));
  console.log(`牌数: ${tiles.length}`);
  
  const hand = Hand.create(tiles, [], { drawnTile: null });
  const shantenCalculator = new ShantenCalculator();
  
  // 1. テンパイ状態の面子分解パターン
  console.log('\n1. テンパイ状態（13枚）の面子分解:');
  const tenpaiResult = shantenCalculator.calculateShanten(hand, true); // ツモ牌抜きで計算
  
  console.log(`シャンテン数: ${tenpaiResult.shanten}`);
  console.log(`手牌タイプ: ${tenpaiResult.handType}`);
  console.log(`構成数: ${tenpaiResult.optimalStates?.length || 0}`);
  
  if (tenpaiResult.optimalStates) {
    tenpaiResult.optimalStates.forEach((comp, i) => {
      console.log(`\n  構成${i + 1}:`);
      comp.components.forEach((component, j) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`    ${j}: ${component.type} [${tilesStr}]`);
      });
    });
  }
  
  // 2. HandAnalyzerでの手牌進行分析
  console.log('\n2. HandAnalyzerでの分析:');
  const analyzer = new HandAnalyzer();
  const progress = analyzer.analyzeHandProgress(hand);
  
  console.log(`シャンテン数: ${progress.shanten}`);
  console.log(`テンパイ: ${progress.isTenpai}`);
  console.log(`有効牌: [${progress.effectiveTiles.map(t => t.toString()).join(', ')}]`);
  console.log(`面子構成数: ${progress.mentsuCompositions?.length || 0}`);
  
  // 3. 3m追加時の仮想手牌作成過程
  console.log('\n3. 3m追加時の仮想手牌作成:');
  
  // determineWaitTypesForTileの処理を再現
  const waitingTile = HandParser.parseHandString('3m')[0];
  console.log(`待ち牌: ${waitingTile}`);
  
  const virtualTiles = [...hand.getConcealedTiles()];
  console.log(`元の手牌（13枚）: ${virtualTiles.map(t => t.toString()).join('')}`);
  
  // ツモ牌がないので、そのまま3mを追加
  virtualTiles.push(waitingTile);
  console.log(`3m追加後（14枚）: ${virtualTiles.map(t => t.toString()).join('')}`);
  
  const virtualHand = Hand.create(virtualTiles, hand.openMelds, {
    drawnTile: '3m',
    isTsumo: true,
    gameContext: hand.gameContext
  });
  
  // 4. 和了形での面子分解
  console.log('\n4. 和了形（14枚）での面子分解:');
  const winResult = shantenCalculator.calculateShanten(virtualHand, false); // 14枚で和了形チェック
  
  console.log(`シャンテン数: ${winResult.shanten}`);
  console.log(`構成数: ${winResult.optimalStates?.length || 0}`);
  
  if (winResult.optimalStates) {
    winResult.optimalStates.forEach((comp, i) => {
      console.log(`\n  構成${i + 1}:`);
      comp.components.forEach((component, j) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`    ${j}: ${component.type} [${tilesStr}]`);
        
        // 3mがこの面子に含まれているか確認
        const tile3mIndex = component.tiles.findIndex(t => t.toString() === '3m');
        if (tile3mIndex >= 0) {
          const firstValue = component.tiles[0].value;
          console.log(`      -> 3mあり: 位置${tile3mIndex}, firstValue=${firstValue}`);
          
          // 待ちタイプ判定
          let waitType = 'UNKNOWN';
          if (component.type === 'sequence' && component.tiles.length === 3) {
            if (tile3mIndex === 0) {
              waitType = firstValue === 1 ? 'PENCHAN' : 'RYANMEN';
            } else if (tile3mIndex === 2) {
              waitType = (firstValue === 1 || firstValue === 7) ? 'PENCHAN' : 'RYANMEN';
            } else {
              waitType = 'KANCHAN';
            }
          }
          console.log(`      -> 待ちタイプ: ${waitType}`);
        }
      });
    });
  }
  
  // 5. 実際のanalyzeWaitTypesの結果
  console.log('\n5. analyzeWaitTypesの実際の結果:');
  const waitResult = analyzer.analyzeWaitTypes(hand);
  
  console.log('待ち牌詳細:');
  waitResult.waitingTiles.forEach(info => {
    console.log(`  ${info.tile}: [${info.waitTypes.join(', ')}] (${info.handTypes.join(', ')})`);
  });
  console.log(`複数の待ちタイプ: ${waitResult.hasMultipleWaitTypes}`);
}

debugTenpaiDecomposition();
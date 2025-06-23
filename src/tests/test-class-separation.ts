// クラス分離後のテスト

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { UsefulTilesCalculator } from '../tensuu/useful-tiles-calculator';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
// import { HandType } from '../common/types';

// テスト用の手牌を作成
function createTestHand(tileStrings: string[]): Tile[] {
  return tileStrings.map(str => {
    return Tile.fromString(str);
  });
}

// テスト用のHandオブジェクトを作成
function createTestHandObject(tileStrings: string[]): Hand {
  const tiles = createTestHand(tileStrings);
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

// テスト実行
function testClassSeparation() {
  console.log('=== クラス分離テスト ===\\n');

  // テスト手牌: 3シャンテン
  const testTiles = createTestHand(['1m', '2m', '4m', '5m', '7m', '8m', '2p', '3p', '5p', '7p', '1s', '4s', '9s']);
  
  console.log('1. ShantenCalculator（統合版）テスト');
  const shantenCalculator = new ShantenCalculator();
  const testHandObject = createTestHandObject(['1m', '2m', '4m', '5m', '7m', '8m', '2p', '3p', '5p', '7p', '1s', '4s', '9s']);
  const regularShanten = shantenCalculator.calculateRegularShanten(testHandObject).shanten;
  const chitoitsuShanten = shantenCalculator.calculateChitoitsuShanten(testHandObject);
  const kokushiShanten = shantenCalculator.calculateKokushiShanten(testHandObject);
  
  console.log(`  通常手シャンテン: ${regularShanten}`);
  console.log(`  七対子シャンテン: ${chitoitsuShanten}`);
  console.log(`  国士無双シャンテン: ${kokushiShanten}`);
  
  console.log('\\n2. UsefulTilesCalculator テスト');
  const usefulTilesCalculator = new UsefulTilesCalculator();
  const usefulTiles = usefulTilesCalculator.calculateUsefulTiles(testTiles);
  const bestUsefulTiles = usefulTilesCalculator.calculateBestUsefulTiles(testTiles);
  
  console.log(`  全体有効牌数: ${usefulTiles.length}`);
  console.log(`  最適有効牌数: ${bestUsefulTiles.length}`);
  if (bestUsefulTiles.length > 0) {
    console.log(`  最適有効牌例: ${bestUsefulTiles.slice(0, 5).map(t => t.toString()).join(', ')}`);
  }
  
  console.log('\\n3. 統合ShantenCalculator API テスト');
  
  // 軽量計算
  const simpleShanten = shantenCalculator.calculateShantenNumber(testHandObject);
  console.log(`  軽量シャンテン: ${simpleShanten}`);
  
  // 基本計算
  const basicResult = shantenCalculator.calculateShanten(testHandObject, {includeUsefulTiles: false, includeWaitType: false});
  console.log(`  基本結果 - シャンテン: ${basicResult.shanten}, タイプ: ${basicResult.handType}`);
  
  // 詳細計算
  const detailedResult = shantenCalculator.calculateShanten(testHandObject, {
    includeUsefulTiles: true
  });
  console.log(`  詳細結果 - 有効牌数: ${detailedResult.usefulTiles?.length || 0}`);
  
  console.log('\\n5. 性能比較テスト');
  
  // 統合前後の性能比較（統合版のみ）
  const baseStartTime = Date.now();
  for (let i = 0; i < 1000; i++) {
    shantenCalculator.calculateRegularShanten(testHandObject).shanten;
  }
  const baseEndTime = Date.now();
  console.log(`  統合版基本計算 1000回: ${baseEndTime - baseStartTime}ms`);
  
  // 統合計算機の性能
  const integratedStartTime = Date.now();
  for (let i = 0; i < 1000; i++) {
    shantenCalculator.calculateShanten(testHandObject);
  }
  const integratedEndTime = Date.now();
  console.log(`  統合版詳細計算 1000回: ${integratedEndTime - integratedStartTime}ms`);
  
  console.log('\\n=== クラス分離テスト完了 ===');
}

// テスト実行
testClassSeparation();

export { testClassSeparation };
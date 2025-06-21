// クラス分離後のテスト

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { BaseShantenCalculator } from '../tensuu/base-shanten-calculator';
import { UsefulTilesCalculator } from '../tensuu/useful-tiles-calculator';
import { MentsuCombinationFinder } from '../tensuu/mentsu-combination-finder';
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
  
  return new Hand(tiles, {
    drawnTile: tiles[tiles.length - 1].toString(),
    isTsumo: true,
    gameContext: mockGameContext,
    openMelds: []
  });
}

// テスト実行
function testClassSeparation() {
  console.log('=== クラス分離テスト ===\\n');

  // テスト手牌: 3シャンテン
  const testTiles = createTestHand(['1m', '2m', '4m', '5m', '7m', '8m', '2p', '3p', '5p', '7p', '1s', '4s', '9s']);
  
  console.log('1. BaseShantenCalculator テスト');
  const baseCalculator = new BaseShantenCalculator();
  const testHandObject = createTestHandObject(['1m', '2m', '4m', '5m', '7m', '8m', '2p', '3p', '5p', '7p', '1s', '4s', '9s']);
  const regularShanten = baseCalculator.calculateRegularShantenFromHand(testHandObject);
  const chitoitsuShanten = baseCalculator.calculateChitoitsuShantenFromHand(testHandObject);
  const kokushiShanten = baseCalculator.calculateKokushiShantenFromHand(testHandObject);
  
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
  
  console.log('\\n3. MentsuCombinationFinder テスト');
  const mentsuFinder = new MentsuCombinationFinder();
  // 和了形でテスト（字牌は正しい範囲で）
  const winningTiles = createTestHand(['1m', '1m', '1m', '2p', '3p', '4p', '5s', '6s', '7s', '1z', '1z', '1z', '2z', '2z']);
  const combinations = mentsuFinder.findAllCombinations(winningTiles);
  const bestCombination = mentsuFinder.findBestCombination(winningTiles);
  
  console.log(`  組み合わせ数: ${combinations.length}`);
  console.log(`  最適組み合わせ: ${bestCombination ? '見つかった' : '見つからない'}`);
  
  console.log('\\n4. 統合ShantenCalculator テスト');
  const shantenCalculator = new ShantenCalculator();
  
  // 軽量計算
  const simpleShanten = shantenCalculator.calculateShanten(testHandObject);
  console.log(`  軽量シャンテン: ${simpleShanten}`);
  
  // 基本計算
  const basicResult = shantenCalculator.calculateBasicShanten(testHandObject);
  console.log(`  基本結果 - シャンテン: ${basicResult.shanten}, タイプ: ${basicResult.handType}`);
  
  // 詳細計算
  const detailedResult = shantenCalculator.calculateShantenDetailed(testHandObject, {
    includeUsefulTiles: true,
    includeMentsuCombinations: false
  });
  console.log(`  詳細結果 - 有効牌数: ${detailedResult.usefulTiles?.length || 0}`);
  
  console.log('\\n5. 性能比較テスト');
  
  // 基本計算機の性能
  const baseStartTime = Date.now();
  for (let i = 0; i < 1000; i++) {
    baseCalculator.calculateRegularShantenFromHand(testHandObject);
  }
  const baseEndTime = Date.now();
  console.log(`  BaseShantenCalculator 1000回: ${baseEndTime - baseStartTime}ms`);
  
  // 統合計算機の性能
  const integratedStartTime = Date.now();
  for (let i = 0; i < 1000; i++) {
    shantenCalculator.calculateShanten(testHandObject);
  }
  const integratedEndTime = Date.now();
  console.log(`  ShantenCalculator 1000回: ${integratedEndTime - integratedStartTime}ms`);
  
  console.log('\\n=== クラス分離テスト完了 ===');
}

// テスト実行
testClassSeparation();

export { testClassSeparation };
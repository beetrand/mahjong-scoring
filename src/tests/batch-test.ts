// バッチでのシャンテン数全件テスト

import { Tile } from './src/common/tile';
import { Hand } from './src/common/hand';
import { ShantenCalculator } from './src/tensuu/shanten-calculator';
import { createMockGameContext } from './src/common/test-helpers';
import * as fs from 'fs';

interface HandData {
  tiles: number[];
  expectedShanten: number;
  expectedKokushi: number;
  expectedChitoitsu: number;
}

function loadTestData(maxLines?: number): HandData[] {
  const content = fs.readFileSync('./data/p_normal_10000.txt', 'utf-8');
  const lines = content.trim().split('\n');
  const dataToProcess = maxLines ? lines.slice(0, maxLines) : lines;
  
  return dataToProcess.map(line => {
    const numbers = line.trim().split(/\s+/).map(n => parseInt(n));
    return {
      tiles: numbers.slice(0, 14),
      expectedShanten: numbers[14],
      expectedKokushi: numbers[15],
      expectedChitoitsu: numbers[16]
    };
  });
}

function createHandString(tileIndices: number[]): string {
  const tiles = tileIndices.map(index => Tile.fromIndex(index));
  return tiles.map(tile => tile.toString()).join(' ');
}

function runBatchTest(maxLines?: number): void {
  console.log(`シャンテン数全件テスト開始${maxLines ? ` (${maxLines}件)` : ''}`);
  
  const calculator = new ShantenCalculator();
  const gameContext = createMockGameContext();
  const testData = loadTestData(maxLines);
  
  let totalCorrect = 0;
  let regularCorrect = 0;
  let kokushiCorrect = 0;
  let chitoitsuCorrect = 0;
  let errorCount = 0;
  
  const errors: Array<{
    line: number;
    tiles: string;
    expected: {regular: number, kokushi: number, chitoitsu: number};
    actual: {regular: number, kokushi: number, chitoitsu: number};
  }> = [];
  
  const startTime = Date.now();
  
  for (let i = 0; i < testData.length; i++) {
    const handData = testData[i];
    
    try {
      // 牌を作成
      const tiles = handData.tiles.map(index => Tile.fromIndex(index));
      const drawnTile = tiles[tiles.length - 1];
      
      // Handオブジェクトを作成
      const hand = new Hand(tiles, [], {
        drawnTile: drawnTile.toString(),
        isTsumo: true,
        gameContext
      });
      
      // シャンテン数を計算
      const regularResult = calculator.calculateRegularShanten(hand);
      const kokushiResult = calculator.calculateKokushiShanten(hand);
      const chitoitsuResult = calculator.calculateChitoitsuShanten(hand);
      
      // 結果チェック
      const regularMatch = regularResult.shanten === handData.expectedShanten;
      const kokushiMatch = kokushiResult === handData.expectedKokushi;
      const chitoitsuMatch = chitoitsuResult === handData.expectedChitoitsu;
      
      if (regularMatch) regularCorrect++;
      if (kokushiMatch) kokushiCorrect++;
      if (chitoitsuMatch) chitoitsuCorrect++;
      
      if (regularMatch && kokushiMatch && chitoitsuMatch) {
        totalCorrect++;
      } else {
        // エラーの詳細を記録
        errors.push({
          line: i + 1,
          tiles: createHandString(handData.tiles),
          expected: {
            regular: handData.expectedShanten,
            kokushi: handData.expectedKokushi,
            chitoitsu: handData.expectedChitoitsu
          },
          actual: {
            regular: regularResult.shanten,
            kokushi: kokushiResult,
            chitoitsu: chitoitsuResult
          }
        });
        errorCount++;
      }
      
      // 進捗表示
      if ((i + 1) % Math.max(1, Math.floor(testData.length / 20)) === 0) {
        const progress = Math.round(((i + 1) / testData.length) * 100);
        console.log(`進捗: ${progress}% (${i + 1}/${testData.length})`);
      }
      
    } catch (error) {
      console.error(`Error processing line ${i + 1}:`, error);
      errorCount++;
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`\n=== シャンテン数検証結果 ===`);
  console.log(`処理時間: ${duration}ms (平均: ${(duration / testData.length).toFixed(2)}ms/件)`);
  console.log(`総件数: ${testData.length}`);
  console.log(`全体正解率: ${totalCorrect}/${testData.length} (${((totalCorrect / testData.length) * 100).toFixed(2)}%)`);
  console.log(`通常手正解率: ${regularCorrect}/${testData.length} (${((regularCorrect / testData.length) * 100).toFixed(2)}%)`);
  console.log(`国士無双正解率: ${kokushiCorrect}/${testData.length} (${((kokushiCorrect / testData.length) * 100).toFixed(2)}%)`);
  console.log(`七対子正解率: ${chitoitsuCorrect}/${testData.length} (${((chitoitsuCorrect / testData.length) * 100).toFixed(2)}%)`);
  
  if (errors.length > 0) {
    console.log(`\n=== エラー詳細 (最初の10件) ===`);
    errors.slice(0, 10).forEach(error => {
      console.log(`Line ${error.line}: ${error.tiles}`);
      console.log(`  期待値: 通常=${error.expected.regular}, 国士=${error.expected.kokushi}, 七対=${error.expected.chitoitsu}`);
      console.log(`  実際値: 通常=${error.actual.regular}, 国士=${error.actual.kokushi}, 七対=${error.actual.chitoitsu}`);
      console.log('');
    });
    
    if (errors.length > 10) {
      console.log(`... 他 ${errors.length - 10} 件のエラー`);
    }
  }
  
  return {
    totalCorrect,
    regularCorrect,
    kokushiCorrect,
    chitoitsuCorrect,
    totalCount: testData.length,
    duration,
    errors
  };
}

// 段階的にテスト実行
console.log('=== 小規模テスト（100件）===');
runBatchTest(100);

console.log('\n=== 中規模テスト（1000件）===');
runBatchTest(1000);

console.log('\n=== 大規模テスト（全件）===');
runBatchTest();
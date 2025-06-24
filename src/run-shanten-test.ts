// シャンテン数検証テスト実行スクリプト

import { Tile } from './common/tile';
import { Hand } from './common/hand';
import { ShantenCalculator } from './tensuu/shanten-calculator';
import { createMockGameContext } from './common/test-helpers';
import * as fs from 'fs';
import * as path from 'path';

interface HandData {
  tiles: number[];
  expectedShanten: number;
  expectedKokushi: number;
  expectedChitoitsu: number;
}

function loadTestData(maxLines: number = 100): HandData[] {
  const filePath = path.join(__dirname, '../data/p_normal_10000.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').slice(0, maxLines);
  
  return lines.map(line => {
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

function runShantenTest(maxLines: number = 100): void {
  console.log(`シャンテン数検証テスト開始（${maxLines}件）`);
  
  const calculator = new ShantenCalculator();
  const gameContext = createMockGameContext();
  const testData = loadTestData(maxLines);
  
  let totalCorrect = 0;
  let regularCorrect = 0;
  let kokushiCorrect = 0;
  let chitoitsuCorrect = 0;
  let errorCount = 0;
  
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
      const handTileCount = hand.getTileCount();
      const meldCount = hand.getMeldCount();
      const hasMelds = hand.hasMelds();
      
      const regularResult = calculator.calculateRegularShanten(handTileCount, meldCount);
      const kokushiResult = calculator.calculateKokushiShanten(handTileCount, hasMelds);
      const chitoitsuResult = calculator.calculateChitoitsuShanten(handTileCount, hasMelds);
      
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
        // エラーの詳細を表示（最初の5件のみ）
        if (errorCount < 5) {
          console.log(`\nエラー Line ${i + 1}: ${createHandString(handData.tiles)}`);
          console.log(`  期待値: 通常=${handData.expectedShanten}, 国士=${handData.expectedKokushi}, 七対=${handData.expectedChitoitsu}`);
          console.log(`  実際値: 通常=${regularResult.shanten}, 国士=${kokushiResult}, 七対=${chitoitsuResult}`);
        }
        errorCount++;
      }
      
      // 進捗表示
      if ((i + 1) % Math.max(1, Math.floor(maxLines / 10)) === 0) {
        const progress = Math.round(((i + 1) / maxLines) * 100);
        console.log(`進捗: ${progress}% (${i + 1}/${maxLines})`);
      }
      
    } catch (error) {
      console.error(`Error processing line ${i + 1}:`, error);
      errorCount++;
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`\n=== シャンテン数検証結果 ===`);
  console.log(`処理時間: ${duration}ms`);
  console.log(`総件数: ${testData.length}`);
  console.log(`全体正解率: ${totalCorrect}/${testData.length} (${((totalCorrect / testData.length) * 100).toFixed(2)}%)`);
  console.log(`通常手正解率: ${regularCorrect}/${testData.length} (${((regularCorrect / testData.length) * 100).toFixed(2)}%)`);
  console.log(`国士無双正解率: ${kokushiCorrect}/${testData.length} (${((kokushiCorrect / testData.length) * 100).toFixed(2)}%)`);
  console.log(`七対子正解率: ${chitoitsuCorrect}/${testData.length} (${((chitoitsuCorrect / testData.length) * 100).toFixed(2)}%)`);
  
  if (errorCount > 5) {
    console.log(`\n... 他 ${errorCount - 5} 件のエラー`);
  }
}

// 段階的にテスト実行
console.log('=== 小規模テスト（100件）===');
runShantenTest(100);

console.log('\n=== 中規模テスト（1000件）===');
runShantenTest(1000);

console.log('\n=== 大規模テスト（10000件）===');
runShantenTest(10000);
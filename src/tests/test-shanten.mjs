// シャンテン数検証テスト - ES Module版

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 簡易的なTileとShantenCalculatorのテスト

function loadTestData(maxLines = 10) {
  const filePath = path.join(__dirname, 'data/p_normal_10000.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').slice(0, maxLines);
  
  return lines.map((line, index) => {
    const numbers = line.trim().split(/\s+/).map(n => parseInt(n));
    return {
      lineNumber: index + 1,
      tiles: numbers.slice(0, 14),
      expectedShanten: numbers[14],
      expectedKokushi: numbers[15],
      expectedChitoitsu: numbers[16]
    };
  });
}

function indexToTileString(index) {
  if (index < 9) return `${index + 1}m`;
  if (index < 18) return `${index - 8}p`;
  if (index < 27) return `${index - 17}s`;
  const honor = index - 27 + 1;
  return `${honor}z`;
}

function createHandString(tileIndices) {
  return tileIndices.map(indexToTileString).join(' ');
}

// テストデータの確認
console.log('=== シャンテン数テストデータ確認 ===');
const testData = loadTestData(10);

testData.forEach(data => {
  console.log(`Line ${data.lineNumber}: ${createHandString(data.tiles)}`);
  console.log(`  インデックス: [${data.tiles.join(', ')}]`);
  console.log(`  期待値: 通常=${data.expectedShanten}, 国士=${data.expectedKokushi}, 七対=${data.expectedChitoitsu}`);
  console.log('');
});

console.log(`データファイルから ${testData.length} 件のテストデータを読み込みました。`);
console.log('本格的なテストを実行するには、TypeScriptプロジェクトのビルドが必要です。');
// シャンテン数検証実行スクリプト

import { runShantenValidation, ShantenValidator } from './shanten-validation';
import * as path from 'path';

// 小規模テスト（最初の100件）
console.log('=== 小規模テスト（100件）===');
const smallResult = runShantenValidation(100);

console.log('\n=== 中規模テスト（1000件）===');
const mediumResult = runShantenValidation(1000);

// 特定の行のデバッグ例
console.log('\n=== 特定行デバッグ例 ===');
const validator = new ShantenValidator();
const filePath = path.join(__dirname, '../../data/p_normal_10000.txt');

// 最初の数行をデバッグ
for (let i = 1; i <= 5; i++) {
  try {
    validator.debugLine(filePath, i);
  } catch (error) {
    console.error(`Error debugging line ${i}:`, error);
  }
}

// 結果の要約
console.log('\n=== 結果要約 ===');
console.log(`小規模テスト（100件）: ${smallResult.correct}/${smallResult.total} 正解`);
console.log(`中規模テスト（1000件）: ${mediumResult.correct}/${mediumResult.total} 正解`);

// パフォーマンス情報
console.log('\n=== パフォーマンス情報 ===');
console.log('新しいTileクラス（indexベース）でのシャンテン計算速度を測定完了');

export { smallResult, mediumResult };
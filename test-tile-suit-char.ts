// Tile.getSuitChar()メソッドのテスト

import { Tile } from './src/common/tile';

function testTileSuitChar() {
  console.log('=== Tile.getSuitChar()メソッドのテスト ===\n');

  // 数牌のテスト
  const testCases = [
    { tile: '1m', expected: 'm', description: '萬子' },
    { tile: '5p', expected: 'p', description: '筒子' },
    { tile: '9s', expected: 's', description: '索子' },
    { tile: '1z', expected: null, description: '風牌（東）' },
    { tile: '5z', expected: null, description: '三元牌（白）' }
  ];

  testCases.forEach(testCase => {
    const tile = new Tile(testCase.tile);
    const result = tile.getSuitChar();
    const status = result === testCase.expected ? '✓' : '✗';
    
    console.log(`${status} ${testCase.tile} (${testCase.description}): ${result} (期待値: ${testCase.expected})`);
    
    if (result !== testCase.expected) {
      console.log(`  エラー: ${testCase.tile}の結果が期待値と異なります`);
    }
  });

  console.log('\n=== toString()メソッドとの整合性確認 ===');
  
  // toString()メソッドでgetSuitChar()が正しく使用されているか確認
  const tiles = ['1m', '5p', '9s'];
  tiles.forEach(tileStr => {
    const tile = new Tile(tileStr);
    const toStringResult = tile.toString();
    const suitChar = tile.getSuitChar();
    
    if (suitChar) {
      const expectedToString = `${tile.value}${suitChar}`;
      const matches = toStringResult === expectedToString;
      const status = matches ? '✓' : '✗';
      
      console.log(`${status} ${tileStr}: toString()="${toStringResult}", 期待値="${expectedToString}"`);
    }
  });
}

testTileSuitChar();
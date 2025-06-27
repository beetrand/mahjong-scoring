import { SimpleMahjongGame } from './simple-mahjong-game';

// ゲーム表示のデバッグ版
class DebugMahjongGame extends SimpleMahjongGame {
  // displayHandWithNumbers メソッドをオーバーライドしてデバッグ情報を追加
  public debugDisplayHandWithNumbers(): void {
    const tiles = this.hand.getConcealedTiles();
    console.log('\n=== デバッグ情報 ===');
    console.log('手牌総数:', tiles.length, '枚');
    console.log('手牌:', tiles.map(t => t.toString()).join(' '));
    console.log('自摸牌:', this.hand.drawnTile?.toString() || 'なし');
    
    // 自摸牌を除いた手牌をソート
    const tilesWithoutTsumo = tiles.filter(t => !this.hand.drawnTile || !t.equals(this.hand.drawnTile));
    const sortedTiles = [...tilesWithoutTsumo].sort((a, b) => a.index - b.index);
    
    console.log('自摸牌除外後:', tilesWithoutTsumo.length, '枚');
    console.log('ソート後:', sortedTiles.map(t => t.toString()).join(' '));
    
    console.log('\n手牌（番号付き）:');
    
    let numberLine = '';
    let tileLine = '';
    
    console.log('各牌の詳細処理:');
    sortedTiles.forEach((tile, index) => {
      const num = (index + 1).toString();
      const tileStr = tile.toString();
      const formattedTileStr = this.formatTile(tile);
      const visibleLength = tileStr.length;
      const cellWidth = 4;
      
      console.log(`  ${index + 1}: "${tileStr}" (${visibleLength}文字) → 番号"${num.padStart(cellWidth, ' ')}" 牌"${' '.repeat(cellWidth - visibleLength) + formattedTileStr}"`);
      
      numberLine += num.padStart(cellWidth, ' ');
      tileLine += ' '.repeat(cellWidth - visibleLength) + formattedTileStr;
    });
    
    // 自摸牌がある場合は右端に離して表示
    if (this.hand.drawnTile) {
      const tsumoStr = this.hand.drawnTile.toString();
      const formattedTsumoStr = this.formatTile(this.hand.drawnTile);
      
      console.log(`  自摸: "${tsumoStr}" → 番号"     t" 牌"    ${formattedTsumoStr}"`);
      
      numberLine += '     t';
      tileLine += '    ' + formattedTsumoStr;
    }
    
    console.log('\n最終結果:');
    console.log('番号行:', numberLine);
    console.log('牌行  :', tileLine);
    console.log('(t = 自摸切り)');
    
    console.log('\n文字数確認:');
    console.log('番号行文字数:', numberLine.length);
    console.log('牌行文字数:', tileLine.length);
    console.log('処理牌数:', sortedTiles.length);
    console.log('=== デバッグ情報終了 ===\n');
  }
  
  // formatTileメソッドを公開
  public formatTile(tile: any): string {
    return super['formatTile'](tile);
  }
}

// デバッグゲームのテスト
async function debugGameTest() {
  console.log('=== デバッグゲーム表示テスト ===\n');
  
  // 手動でゲーム状態を設定
  console.log('手動でゲーム状態を設定してテストします...\n');
  
  // 何回かランダムな手牌で表示テスト
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- テスト ${i} ---`);
    
    // 新しいゲームを作成
    new DebugMahjongGame();
    
    // デバッグ表示を実行
    // testGame.debugDisplayHandWithNumbers();
    
    console.log('このテストは実際のゲーム中でのみ有効です。');
  }
  
  console.log('\n実際の問題確認のため、ゲームを起動して手動で確認してください。');
  console.log('npx tsx src/games/play-game.ts');
}

// テスト実行
debugGameTest();
// テンパイ詳細表示のデモ（独立したテスト）

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import type { Wind } from '../common/types';

function runTenpaiDemo(): void {
  console.log('=== テンパイ詳細表示デモ ===\n');
  console.log('実際のゲームでテンパイ詳細を確認するには:');
  console.log('npx tsx src/games/play-game.ts\n');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 1 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  const analyzer = new HandAnalyzer();
  
  // 色付きフォーマット関数
  const formatTile = (tile: Tile): string => {
    const str = tile.toString();
    
    if (tile.isRed) {
      return `\x1b[31m${str}\x1b[0m`;
    }
    
    if (tile.suit === 'man') {
      return `\x1b[31m${str}\x1b[0m`;
    } else if (tile.suit === 'pin') {
      return `\x1b[34m${str}\x1b[0m`;
    } else if (tile.suit === 'sou') {
      return `\x1b[32m${str}\x1b[0m`;
    }
    
    return str;
  };
  
  const groupTilesByType = (tiles: Tile[]): string => {
    const uniqueTiles = Array.from(new Set(tiles.map(t => t.toString())))
      .map(str => new Tile(str))
      .sort(Tile.compare);
    
    if (uniqueTiles.length === 0) return 'なし';
    
    return uniqueTiles.map(tile => formatTile(tile)).join(' ');
  };
  
  const getWaitTypeName = (waitType: string): string => {
    switch (waitType) {
      case 'tanki': return '単騎待ち';
      case 'ryanmen': return '両面待ち';
      case 'kanchan': return '嵌張待ち';
      case 'penchan': return '辺張待ち';
      case 'shanpon': return '双碰待ち';
      default: return waitType;
    }
  };
  
  // デモ手牌: テンパイ状態
  console.log('デモ手牌（テンパイ状態）:');
  const demoTiles = [
    new Tile('5mr'), new Tile('5m'), 
    new Tile('4p'), new Tile('4p'), new Tile('4p'), new Tile('5pr'), new Tile('6p'), 
    new Tile('7p'), new Tile('7p'), new Tile('8p'), new Tile('9p'),
    new Tile('5s'), new Tile('6s')
  ];
  
  const hand = Hand.create(demoTiles, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log(`手牌: ${hand.getConcealedTiles().map(t => formatTile(t)).join(' ')}`);
  
  const handProgress = analyzer.analyzeHandProgress(hand);
  
  if (handProgress.shanten === 0) {
    console.log('テンパイ！');
    
    if (handProgress.tenpaiEffectiveTiles) {
      const tenpaiInfo = handProgress.tenpaiEffectiveTiles;
      
      // 待ち牌を表示
      if (tenpaiInfo.allEffectiveTiles.length > 0) {
        const groupedTiles = groupTilesByType(tenpaiInfo.allEffectiveTiles);
        console.log(`待ち牌: ${groupedTiles}`);
      }
      
      // 詳細な待ち情報を表示
      if (tenpaiInfo.compositionsWithEffectiveTiles.length > 0) {
        console.log('待ちの詳細:');
        
        tenpaiInfo.compositionsWithEffectiveTiles.forEach((comp: any) => {
          if (comp.componentsWithEffectiveTiles.length > 0) {
            comp.componentsWithEffectiveTiles.forEach((compInfo: any) => {
              const waitTypeName = getWaitTypeName(compInfo.waitType);
              const effectiveTilesStr = compInfo.effectiveTiles.map((t: any) => formatTile(t)).join(' ');
              console.log(`  ${waitTypeName}: ${effectiveTilesStr}`);
            });
          }
        });
      }
    }
  }
  
  console.log('\n=== デモ完了 ===');
  console.log('このようにゲーム中にテンパイ詳細情報が表示されます。');
}

runTenpaiDemo();
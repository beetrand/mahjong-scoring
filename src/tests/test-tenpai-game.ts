// テンパイ詳細表示のテスト用ゲーム

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import type { Wind } from '../common/types';

function testTenpaiGameDisplay(): void {
  console.log('=== テンパイ詳細表示テスト ===\n');
  
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
  
  const getHandTypeName = (handType: string): string => {
    switch (handType) {
      case 'regular': return '通常手';
      case 'chitoitsu': return '七対子';
      case 'kokushi': return '国士無双';
      default: return handType;
    }
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
  
  // テスト例1: 両面待ち
  console.log('1. 両面待ちのテンパイ');
  const tiles1 = [
    new Tile('1m'), new Tile('1m'), new Tile('1m'),  // 刻子
    new Tile('4p'), new Tile('5p'), new Tile('6p'),  // 順子
    new Tile('7s'), new Tile('8s'), new Tile('9s'),  // 順子
    new Tile('2z'), new Tile('2z'),                  // 雀頭
    new Tile('3m'), new Tile('4m')                   // 両面待ち
  ];
  
  const hand1 = Hand.create(tiles1, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log(`手牌: ${hand1.getConcealedTiles().map(t => formatTile(t)).join(' ')}`);
  
  const handProgress1 = analyzer.analyzeHandProgress(hand1);
  
  if (handProgress1.shanten === 0) {
    console.log('テンパイ！');
    
    if (handProgress1.tenpaiEffectiveTiles) {
      const tenpaiInfo = handProgress1.tenpaiEffectiveTiles;
      
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
    } else {
      // 通常の有効牌表示
      if (handProgress1.effectiveTiles.length > 0) {
        const groupedTiles = groupTilesByType(handProgress1.effectiveTiles);
        console.log(`待ち牌: ${groupedTiles}`);
      }
    }
  }
  
  console.log(`手牌タイプ: ${getHandTypeName(handProgress1.handType)}\n`);
  
  // テスト例2: 実際のテンパイ例
  console.log('2. 実際のテンパイ例（両面待ち）');
  const tiles2 = [
    new Tile('5mr'), new Tile('5m'), 
    new Tile('4p'), new Tile('4p'), new Tile('4p'), new Tile('5pr'), new Tile('6p'), 
    new Tile('7p'), new Tile('7p'), new Tile('8p'), new Tile('9p'),
    new Tile('5s'), new Tile('6s')
  ];
  
  const hand2 = Hand.create(tiles2, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  console.log(`手牌: ${hand2.getConcealedTiles().map(t => formatTile(t)).join(' ')}`);
  
  const handProgress2 = analyzer.analyzeHandProgress(hand2);
  
  if (handProgress2.shanten === 0) {
    console.log('テンパイ！');
    
    if (handProgress2.tenpaiEffectiveTiles) {
      const tenpaiInfo = handProgress2.tenpaiEffectiveTiles;
      
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
  
  console.log(`手牌タイプ: ${getHandTypeName(handProgress2.handType)}\n`);
  
  console.log('=== テスト完了 ===');
  console.log('実際のゲームでテンパイ詳細を確認するには:');
  console.log('npx tsx src/games/play-game.ts');
}

// テスト実行
testTenpaiGameDisplay();
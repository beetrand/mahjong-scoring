import { SimpleMahjongGame } from './simple-mahjong-game';
import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { TileGenerator } from '../common/tile-generator';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import { EffectiveTilesCalculator } from '../tensuu/effective-tiles-calculator';
import type { Wind } from '../common/types';

// 有効牌表示付きのゲームデモ
function gameWithEffectiveTiles() {
  console.log('=== 有効牌表示付きゲームデモ ===\n');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 1 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  const shantenCalculator = new ShantenCalculator();
  const effectiveCalculator = new EffectiveTilesCalculator();
  
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
  
  // 有効牌のグループ化
  const groupTilesByType = (tiles: Tile[]): string => {
    const uniqueTiles = Array.from(new Set(tiles.map(t => t.toString())))
      .map(str => new Tile(str))
      .sort(Tile.compare);
    
    if (uniqueTiles.length === 0) return 'なし';
    
    return uniqueTiles.map(tile => formatTile(tile)).join(' ');
  };
  
  // ランダム手牌でテスト
  const initialTiles = TileGenerator.generateRandomHand(13);
  let hand = Hand.create(initialTiles, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  const mountain = TileGenerator.createMountain(initialTiles);
  
  console.log('初期手牌:', initialTiles.map(t => formatTile(t)).join(' '));
  
  // 3ターンのシミュレーション
  for (let turn = 1; turn <= 3; turn++) {
    console.log(`\n--- ターン ${turn} ---`);
    
    // 自摸
    const drawnTile = TileGenerator.drawFromMountain(mountain);
    if (!drawnTile) break;
    
    hand.draw(drawnTile);
    
    // 手牌表示
    const tiles = hand.getConcealedTiles();
    const removeTsumoTileOnce = (tiles: Tile[], drawnTile: Tile | null): Tile[] => {
      if (!drawnTile) return tiles;
      
      const result: Tile[] = [];
      let tsumoRemoved = false;
      
      for (const tile of tiles) {
        if (!tsumoRemoved && tile.equals(drawnTile)) {
          tsumoRemoved = true;
          continue;
        }
        result.push(tile);
      }
      
      return result;
    };
    
    const tilesWithoutTsumo = removeTsumoTileOnce(tiles, hand.drawnTile);
    const sortedTiles = [...tilesWithoutTsumo].sort(Tile.compare);
    
    let displayStr = sortedTiles.map(t => formatTile(t)).join(' ');
    if (hand.drawnTile) {
      displayStr += `  ${formatTile(hand.drawnTile)}`;
    }
    
    console.log('手牌:', displayStr);
    
    // シャンテン数と有効牌表示
    const shantenResult = shantenCalculator.calculateShanten(hand);
    
    if (shantenResult.shanten === -1) {
      console.log('テンパイ！（和了形）');
    } else if (shantenResult.shanten === 0) {
      console.log('テンパイ！');
    } else {
      console.log(`シャンテン数: ${shantenResult.shanten}`);
    }
    
    const handTypeName = shantenResult.handType === 'regular' ? '通常手' :
                        shantenResult.handType === 'chitoitsu' ? '七対子' :
                        shantenResult.handType === 'kokushi' ? '国士無双' : shantenResult.handType;
    console.log(`手牌タイプ: ${handTypeName}`);
    
    // 有効牌を表示（テンパイしていない場合のみ）
    if (shantenResult.shanten > 0) {
      const effectiveResult = effectiveCalculator.calculateEffectiveTiles(hand);
      
      if (effectiveResult.tiles.length > 0) {
        const groupedTiles = groupTilesByType(effectiveResult.tiles);
        console.log(`有効牌: ${groupedTiles}`);
      } else {
        console.log('有効牌: なし');
      }
    }
    
    // ランダムに捨牌
    const randomIndex = Math.floor(Math.random() * sortedTiles.length);
    const tileToDiscard = sortedTiles[randomIndex];
    
    hand.discard(tileToDiscard);
    console.log(`捨牌: ${formatTile(tileToDiscard)}`);
  }
  
  console.log('\n=== デモ終了 ===');
  console.log('実際のゲームをプレイするには:');
  console.log('npx tsx src/games/play-game.ts');
}

// デモ実行
gameWithEffectiveTiles();
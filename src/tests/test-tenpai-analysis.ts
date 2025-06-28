// テンパイ時の詳細分析テスト

import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import type { Wind } from '../common/types';

function testTenpaiAnalysis(): void {
  console.log('=== テンパイ詳細分析テスト ===\n');
  
  const gameContext = {
    roundWind: 1 as Wind,
    playerWind: 1 as Wind,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: true
  };
  
  const analyzer = new HandAnalyzer();
  
  // テスト1: 通常手のテンパイ（両面待ち）
  console.log('1. 通常手のテンパイ（両面待ち）');
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
  
  const progress1 = analyzer.analyzeHandProgress(hand1);
  console.log(`  シャンテン数: ${progress1.shanten}`);
  console.log(`  テンパイ: ${progress1.isTenpai}`);
  console.log(`  有効牌: ${progress1.effectiveTiles.map(t => t.toString()).join(' ')}`);
  console.log(`  テンパイ詳細情報: ${progress1.tenpaiEffectiveTiles ? '取得済み' : '未取得'}`);
  
  if (progress1.tenpaiEffectiveTiles) {
    console.log(`  テンパイ詳細 - 面子構成数: ${progress1.tenpaiEffectiveTiles.compositionsWithEffectiveTiles.length}`);
    console.log(`  テンパイ詳細 - 全有効牌: ${progress1.tenpaiEffectiveTiles.allEffectiveTiles.map(t => t.toString()).join(' ')}`);
  }
  
  // テスト2: 手牌：5mr 5m 4p 4p 4p 5pr 6p 7p 7p 8p 9p 5s 6s（テンパイ）
  console.log('\n2. 実際のテンパイ例');
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
  
  const progress2 = analyzer.analyzeHandProgress(hand2);
  console.log(`  シャンテン数: ${progress2.shanten}`);
  console.log(`  テンパイ: ${progress2.isTenpai}`);
  console.log(`  有効牌: ${progress2.effectiveTiles.map(t => t.toString()).join(' ')}`);
  console.log(`  テンパイ詳細情報: ${progress2.tenpaiEffectiveTiles ? '取得済み' : '未取得'}`);
  
  if (progress2.tenpaiEffectiveTiles) {
    console.log(`  テンパイ詳細 - 面子構成数: ${progress2.tenpaiEffectiveTiles.compositionsWithEffectiveTiles.length}`);
    console.log(`  テンパイ詳細 - 全有効牌: ${progress2.tenpaiEffectiveTiles.allEffectiveTiles.map(t => t.toString()).join(' ')}`);
    
    // 各面子構成の詳細
    progress2.tenpaiEffectiveTiles.compositionsWithEffectiveTiles.forEach((comp, i) => {
      console.log(`  構成${i+1}:`);
      comp.componentsWithEffectiveTiles.forEach((compInfo, j) => {
        console.log(`    コンポーネント${j+1}: ${compInfo.waitType}, 有効牌: ${compInfo.effectiveTiles.map(t => t.toString()).join(' ')}`);
      });
    });
  }
  
  // テスト3: 1シャンテン（テンパイでない）
  console.log('\n3. 1シャンテン（テンパイでない）');
  const tiles3 = [
    new Tile('1m'), new Tile('1m'), new Tile('1m'),
    new Tile('4p'), new Tile('5p'), new Tile('6p'),
    new Tile('7s'), new Tile('8s'), new Tile('9s'),
    new Tile('2z'), new Tile('2z'),
    new Tile('3m'), new Tile('5m')  // バラバラ
  ];
  
  const hand3 = Hand.create(tiles3, [], {
    drawnTile: null,
    isTsumo: false,
    gameContext
  });
  
  const progress3 = analyzer.analyzeHandProgress(hand3);
  console.log(`  シャンテン数: ${progress3.shanten}`);
  console.log(`  テンパイ: ${progress3.isTenpai}`);
  console.log(`  有効牌: ${progress3.effectiveTiles.map(t => t.toString()).join(' ')}`);
  console.log(`  テンパイ詳細情報: ${progress3.tenpaiEffectiveTiles ? '取得済み' : '未取得'}`);
}

// テスト実行
testTenpaiAnalysis();
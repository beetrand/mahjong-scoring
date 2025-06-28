// 塔子から待ちタイプ判定のデバッグ

import { Hand } from './src/common/hand';
import { HandParser } from './src/common/hand-parser';
import { HandAnalyzer } from './src/tensuu/hand-analyzer';
import { ComponentType } from './src/common/component';

function debugTaatsuLogic() {
  console.log('=== 塔子から待ちタイプ判定のデバッグ ===\n');
  
  // 12345m123456p11s
  const tiles = [
    ...HandParser.parseHandString('12345m'),
    ...HandParser.parseHandString('123456p'),
    ...HandParser.parseHandString('11s')
  ];
  
  const hand = Hand.create(tiles, [], { drawnTile: null });
  const analyzer = new HandAnalyzer();
  const progress = analyzer.analyzeHandProgress(hand);
  
  console.log('手牌:', tiles.map(t => t.toString()).join(''));
  console.log(`面子構成数: ${progress.mentsuCompositions?.length || 0}\n`);
  
  if (progress.mentsuCompositions) {
    progress.mentsuCompositions.forEach((comp, i) => {
      console.log(`構成${i + 1}:`);
      comp.components.forEach((component, j) => {
        const tilesStr = component.tiles.map(t => t.toString()).join('');
        console.log(`  ${j}: ${component.type} [${tilesStr}]`);
        
        if (component.type === ComponentType.TAATSU) {
          console.log(`    -> 塔子発見: [${tilesStr}]`);
          
          // 3mが入る可能性をチェック
          const waitingTile = HandParser.parseHandString('3m')[0];
          const waitType = debugTaatsuWaitType(component, waitingTile);
          console.log(`    -> 3m待ちタイプ: ${waitType}`);
        }
      });
      console.log();
    });
  }
}

// デバッグ用の塔子待ちタイプ判定
function debugTaatsuWaitType(taatsu: any, waitingTile: any): string {
  if (taatsu.tiles.length !== 2) {
    return 'NOT_TAATSU';
  }

  const [tile1, tile2] = taatsu.tiles;
  
  console.log(`      塔子: ${tile1.toString()}-${tile2.toString()}, 待ち牌: ${waitingTile.toString()}`);
  console.log(`      スート: ${tile1.suit}-${tile2.suit}-${waitingTile.suit}`);
  
  // 同じスートでない場合は判定不可
  if (tile1.suit !== tile2.suit || tile1.suit !== waitingTile.suit) {
    return 'DIFFERENT_SUIT';
  }

  const values = [tile1.value, tile2.value].sort((a, b) => a - b);
  const waitValue = waitingTile.value;
  
  console.log(`      values: [${values[0]}, ${values[1]}], waitValue: ${waitValue}`);

  // 連続する2牌の塔子の場合
  if (values[1] - values[0] === 1) {
    console.log(`      連続塔子`);
    // 両面塔子の可能性
    if (waitValue === values[0] - 1) {
      // 下側に入る場合：123なら1がペンチャン、234以上ならリャンメン
      const result = values[0] === 2 ? 'PENCHAN' : 'RYANMEN';
      console.log(`      下側: waitValue=${waitValue}, values[0]-1=${values[0]-1}, result=${result}`);
      return result;
    } else if (waitValue === values[1] + 1) {
      // 上側に入る場合：789なら9がペンチャン、678以下ならリャンメン
      const result = values[1] === 8 ? 'PENCHAN' : 'RYANMEN';
      console.log(`      上側: waitValue=${waitValue}, values[1]+1=${values[1]+1}, result=${result}`);
      return result;
    } else {
      console.log(`      連続塔子だが待ち牌が該当しない`);
      return 'NOT_MATCHING';
    }
  }
  
  // 1つ飛びの塔子の場合（嵌張）
  if (values[1] - values[0] === 2) {
    console.log(`      嵌張塔子`);
    if (waitValue === values[0] + 1) {
      console.log(`      嵌張: waitValue=${waitValue}, values[0]+1=${values[0]+1}`);
      return 'KANCHAN';
    } else {
      console.log(`      嵌張塔子だが待ち牌が該当しない`);
      return 'NOT_MATCHING';
    }
  }

  console.log(`      その他の塔子パターン`);
  return 'OTHER';
}

debugTaatsuLogic();
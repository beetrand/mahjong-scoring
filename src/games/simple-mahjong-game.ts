import * as readline from 'readline';
import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { TileGenerator } from '../common/tile-generator';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import type { Wind } from '../common/types';

export class SimpleMahjongGame {
  private rl: readline.Interface;
  protected hand!: Hand;
  private mountain: Tile[];
  private handAnalyzer: HandAnalyzer;
  private gameContext: any;
  private turnCount: number;
  private discardedTiles: Tile[];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.mountain = []
    this.handAnalyzer = new HandAnalyzer();

    this.gameContext = {
      roundWind: 1 as Wind,
      playerWind: 1 as Wind,
      doraIndicators: [],
      uraDoraIndicators: [],
      hasRedDora: true
    };
    
    this.turnCount = 0;
    this.discardedTiles = [];
  }

  public async start(): Promise<void> {
    console.log('=== 簡易麻雀ゲーム ===\n');
    console.log('ルール: 自摸→捨牌を繰り返します。');
    console.log('捨て牌は番号で選択してください。\n');
    
    // 初期手牌を生成
    this.initializeGame();
    
    // ゲームループ
    await this.gameLoop();
  }

  private initializeGame(): void {
    // ランダムな手牌13枚を生成
    const initialTiles = TileGenerator.generateRandomHand(13);
    
    this.hand = Hand.create(initialTiles, [], {
      drawnTile: null,
      isTsumo: false,
      gameContext: this.gameContext
    });
    
    // 山牌を作成（手牌の牌は除外）
    this.mountain = TileGenerator.createMountain(initialTiles);
    
    console.log('初期手牌が配られました！\n');
  }

  private async gameLoop(): Promise<void> {
    while (this.mountain.length > 0) {
      this.turnCount++;
      
      // ターミナルをクリア
      console.clear();
      
      console.log(`--- ターン ${this.turnCount} (山牌残り: ${this.mountain.length}枚) ---`);
      
      // 捨て牌一覧を表示
      if (this.discardedTiles.length > 0) {
        console.log(`捨て牌: ${this.discardedTiles.map(t => this.formatTile(t)).join(' ')}`);
        console.log('');
      }
      
      // 現在の手牌を表示
      this.displayHand();
      
      // シャンテン数を計算・表示
      this.displayShanten();
      
      // 自摸
      const drawnTile = TileGenerator.drawFromMountain(this.mountain);
      if (!drawnTile) break;
      
      this.hand.draw(drawnTile);
      // 自摸牌の表示は手牌表示に含まれるので削除
      
      // 和了判定
      const winAnalysis = this.handAnalyzer.analyzeWinning(this.hand);
      if (winAnalysis.isWinning) {
        console.log('\n🎉 和了！おめでとうございます！');
        
        // 和了詳細情報を表示
        this.displayWinningDetails(winAnalysis);
        break;
      }
      
      // 捨て牌選択を促す
      this.displayHandWithNumbers();
      
      const discardIndex = await this.askForDiscard();
      const handTiles = this.hand.getConcealedTiles();
      
      if (discardIndex >= 0 && discardIndex < handTiles.length) {
        const tileToDiscard = handTiles[discardIndex];
        this.hand.discard(tileToDiscard);
        this.discardedTiles.push(tileToDiscard);
        console.log(`捨牌: ${this.formatTile(tileToDiscard)}`);
      }
      
    }
    
    console.log('\n=== ゲーム終了 ===');
    console.log('山牌がなくなりました。');
    this.rl.close();
  }

  private displayHand(): void {
    const tiles = this.hand.getConcealedTiles();
    
    // 自摸牌を1枚だけ除いた手牌をソート
    const tilesWithoutTsumo = this.removeTsumoTileOnce(tiles);
    const sortedTiles = [...tilesWithoutTsumo].sort(Tile.compare);
    
    // 自摸牌がある場合は右端に離して表示
    let displayStr = sortedTiles.map(t => this.formatTile(t)).join(' ');
    if (this.hand.drawnTile) {
      displayStr += `  ${this.formatTile(this.hand.drawnTile)}`;
    }
    
    console.log(`現在の手牌: ${displayStr}`);
  }

  private displayHandWithNumbers(): void {
    const tiles = this.hand.getConcealedTiles();
    console.log('\n手牌（番号付き）:');
    
    // 自摸牌を1枚だけ除いた手牌をソート
    const tilesWithoutTsumo = this.removeTsumoTileOnce(tiles);
    const sortedTiles = [...tilesWithoutTsumo].sort(Tile.compare);
    
    let numberLine = '';
    let tileLine = '';
    
    // 通常の手牌
    sortedTiles.forEach((tile, index) => {
      const num = (index + 1).toString();
      const tileStr = tile.toString(); // 色なしの文字列
      const formattedTileStr = this.formatTile(tile); // 色付きの文字列
      
      // 見た目の長さで計算（赤ドラは3文字、それ以外は2文字）
      const visibleLength = tileStr.length;
      const cellWidth = 4; // 各セルの幅を4文字に固定
      
      // 番号を右寄せで表示
      numberLine += num.padStart(cellWidth, ' ');
      
      // 牌を表示（色付き）
      // 左に1スペース、右に残りをパディング
      tileLine += ' '.repeat(cellWidth -visibleLength) + formattedTileStr
    });
    
    // 自摸牌がある場合は右端に離して表示
    if (this.hand.drawnTile) {
      const formattedTsumoStr = this.formatTile(this.hand.drawnTile);
      
      // 2スペースの区切りを追加
      numberLine += '     t';
      tileLine += '    ' + formattedTsumoStr;
    }
    
    console.log(numberLine);
    console.log(tileLine);
    console.log('\n(t = 自摸切り)');
  }

  private displayShanten(): void {
    // HandAnalyzerを使用して包括的な分析を実行
    const handProgress = this.handAnalyzer.analyzeHandProgress(this.hand);
    
    if (handProgress.shanten === -1) {
      console.log('テンパイ！（和了形）');
    } else if (handProgress.shanten === 0) {
      console.log('テンパイ！');
      
      // テンパイ時の詳細情報を表示
      this.displayTenpaiDetails(handProgress);
    } else {
      console.log(`シャンテン数: ${handProgress.shanten}`);
    }
    
    console.log(`手牌タイプ: ${this.getHandTypeName(handProgress.handType)}`);
    
    // 有効牌を表示（テンパイしていない場合のみ）
    if (handProgress.shanten > 0) {
      if (handProgress.effectiveTiles.length > 0) {
        // 有効牌を種類別にグループ化
        const groupedTiles = this.groupTilesByType(handProgress.effectiveTiles);
        console.log(`有効牌: ${groupedTiles}`);
      } else {
        console.log('有効牌: なし');
      }
    }
  }

  private displayTenpaiDetails(handProgress: any): void {
    if (!handProgress.tenpaiEffectiveTiles) {
      // 通常の有効牌表示
      if (handProgress.effectiveTiles.length > 0) {
        const groupedTiles = this.groupTilesByType(handProgress.effectiveTiles);
        console.log(`待ち牌: ${groupedTiles}`);
      }
      return;
    }
    
    const tenpaiInfo = handProgress.tenpaiEffectiveTiles;
    
    // 待ち牌を表示
    if (tenpaiInfo.allEffectiveTiles.length > 0) {
      const groupedTiles = this.groupTilesByType(tenpaiInfo.allEffectiveTiles);
      console.log(`待ち牌: ${groupedTiles}`);
    }
    
    // 詳細な待ち情報を表示
    if (tenpaiInfo.compositionsWithEffectiveTiles.length > 0) {
      console.log('待ちの詳細:');
      
      tenpaiInfo.compositionsWithEffectiveTiles.forEach((comp: any) => {
        if (comp.componentsWithEffectiveTiles.length > 0) {
          comp.componentsWithEffectiveTiles.forEach((compInfo: any) => {
            const waitTypeName = this.getWaitTypeName(compInfo.waitType);
            const effectiveTilesStr = compInfo.effectiveTiles.map((t: any) => this.formatTile(t)).join(' ');
            console.log(`  ${waitTypeName}: ${effectiveTilesStr}`);
          });
        }
      });
    }
  }

  private displayWinningDetails(winAnalysis: any): void {
    console.log(`最終手牌: ${this.hand.getConcealedTiles().map(t => this.formatTile(t)).join(' ')}`);
    
    if (!winAnalysis.winningInfo) {
      return;
    }
    
    const winningInfo = winAnalysis.winningInfo;
    const progress = winAnalysis.handProgress;
    
    // 和了牌を強調表示
    console.log(`和了牌: ${this.formatTile(winningInfo.winningTile)} (自摸)`);
    
    // 手牌タイプを表示
    console.log(`手牌タイプ: ${this.getHandTypeName(progress.handType)}`);
    
    // 待ちタイプを表示
    if (winningInfo.compositionsWithWaitTypes.length > 0) {
      const waitTypes = winningInfo.compositionsWithWaitTypes.map((cwt: any) => cwt.waitType as string);
      const uniqueWaitTypes = [...new Set(waitTypes)];
      const waitTypesStr = uniqueWaitTypes.map(wt => this.getWaitTypeName(wt as string)).join('・');
      console.log(`待ちの種類: ${waitTypesStr}`);
      
      // 面子構成の詳細を表示
      console.log('\n面子構成の詳細:');
      winningInfo.compositionsWithWaitTypes.forEach((cwt: any, index: number) => {
        console.log(`  パターン${index + 1}: ${this.getWaitTypeName(cwt.waitType as string)}`);
        
        // 面子構成を表示
        if (cwt.composition && cwt.composition.components) {
          cwt.composition.components.forEach((component: any, compIndex: number) => {
            const tilesStr = component.tiles.map((t: any) => this.formatTile(t)).join(' ');
            const componentType = this.getComponentTypeName(component.type);
            
            // 和了牌が入った面子を強調
            if (compIndex === cwt.composition.winningTilePosition.componentIndex) {
              console.log(`    ${componentType}: [${tilesStr}] ← 和了牌が入った面子`);
            } else {
              console.log(`    ${componentType}: [${tilesStr}]`);
            }
          });
        }
      });
    }
    
    // テンパイ時の待ち牌情報も表示
    if (progress.tenpaiEffectiveTiles && progress.tenpaiEffectiveTiles.allEffectiveTiles.length > 0) {
      const allWaitingTiles = this.groupTilesByType(progress.tenpaiEffectiveTiles.allEffectiveTiles);
      console.log(`\n全待ち牌: ${allWaitingTiles}`);
    }
  }

  private getComponentTypeName(componentType: string): string {
    switch (componentType) {
      case 'sequence': return '順子';
      case 'triplet': return '刻子';
      case 'quad': return '槓子';
      case 'pair': return '対子';
      case 'taatsu': return '塔子';
      case 'isolated': return '孤立牌';
      default: return componentType;
    }
  }

  private getHandTypeName(handType: string): string {
    switch (handType) {
      case 'regular': return '通常手';
      case 'chitoitsu': return '七対子';
      case 'kokushi': return '国士無双';
      default: return handType;
    }
  }

  private getWaitTypeName(waitType: string): string {
    switch (waitType) {
      case 'tanki': return '単騎待ち';
      case 'ryanmen': return '両面待ち';
      case 'kanchan': return '嵌張待ち';
      case 'penchan': return '辺張待ち';
      case 'shanpon': return '双碰待ち';
      default: return waitType;
    }
  }

  protected formatTile(tile: Tile): string {
    const str = tile.toString();
    
    
    // 数牌の色分け
    if (tile.suit === 'man') {
      return `\x1b[31m${str}\x1b[0m`; // 萬子（赤）
    } else if (tile.suit === 'pin') {
      return `\x1b[34m${str}\x1b[0m`; // 筒子（青）
    } else if (tile.suit === 'sou') {
      return `\x1b[32m${str}\x1b[0m`; // 索子（緑）
    }
    
    // 字牌は無色
    return str;
  }

  private groupTilesByType(tiles: Tile[]): string {
    // 重複を除去してソート
    const uniqueTiles = Array.from(new Set(tiles.map(t => t.toString())))
      .map(str => new Tile(str))
      .sort(Tile.compare);
    
    if (uniqueTiles.length === 0) return 'なし';
    
    // 色付きで表示
    return uniqueTiles.map(tile => this.formatTile(tile)).join(' ');
  }

  private removeTsumoTileOnce(tiles: Tile[]): Tile[] {
    if (!this.hand.drawnTile) {
      return tiles;
    }
    
    const result: Tile[] = [];
    let tsumoRemoved = false;
    
    for (const tile of tiles) {
      if (!tsumoRemoved && tile.equals(this.hand.drawnTile)) {
        tsumoRemoved = true;
        continue;
      }
      result.push(tile);
    }
    
    return result;
  }

  private askForDiscard(): Promise<number> {
    return new Promise((resolve) => {
      this.rl.question('\nどの牌を捨てますか？ (番号または t を入力): ', (answer) => {
        // 自摸切りの場合
        if (answer.toLowerCase() === 't') {
          if (this.hand.drawnTile) {
            const tiles = this.hand.getConcealedTiles();
            const tsumoIndex = tiles.findIndex(t => t.equals(this.hand.drawnTile!));
            resolve(tsumoIndex);
            return;
          } else {
            console.log('自摸牌がありません。');
            this.askForDiscard().then(resolve);
            return;
          }
        }
        
        // 番号入力の場合
        const num = parseInt(answer, 10);
        const tilesWithoutTsumo = this.removeTsumoTileOnce(this.hand.getConcealedTiles());
        
        if (isNaN(num) || num < 1 || num > tilesWithoutTsumo.length) {
          console.log('無効な番号です。もう一度入力してください。');
          this.askForDiscard().then(resolve);
        } else {
          // ソートされた手牌での番号から実際のインデックスを取得
          const sortedTiles = [...tilesWithoutTsumo].sort(Tile.compare);
          const selectedTile = sortedTiles[num - 1];
          const actualIndex = this.hand.getConcealedTiles().findIndex(t => t.equals(selectedTile));
          resolve(actualIndex);
        }
      });
    });
  }
}
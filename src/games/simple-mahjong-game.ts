import * as readline from 'readline';
import { Hand } from '../common/hand';
import { Tile } from '../common/tile';
import { TileGenerator } from '../common/tile-generator';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import { HandAnalyzer } from '../tensuu/hand-analyzer';
import { EffectiveTilesCalculator } from '../tensuu/effective-tiles-calculator';
import type { Wind } from '../common/types';

export class SimpleMahjongGame {
  private rl: readline.Interface;
  private hand!: Hand;
  private mountain: Tile[];
  private shantenCalculator: ShantenCalculator;
  private handAnalyzer: HandAnalyzer;
  private effectiveTilesCalculator: EffectiveTilesCalculator;
  private gameContext: any;
  private turnCount: number;
  private discardedTiles: Tile[];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.mountain = []
    this.shantenCalculator = new ShantenCalculator();
    this.handAnalyzer = new HandAnalyzer();
    this.effectiveTilesCalculator = new EffectiveTilesCalculator();

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
        console.log(`最終手牌: ${this.hand.getConcealedTiles().map(t => this.formatTile(t)).join(' ')}`);
        console.log(this.hand);
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
      
      // 捨て牌一覧を表示
      if (this.discardedTiles.length > 0) {
        console.log(`\n捨て牌: ${this.discardedTiles.map(t => this.formatTile(t)).join(' ')}`);
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
      const tsumoStr = this.hand.drawnTile.toString();
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
    const shantenResult = this.shantenCalculator.calculateShanten(this.hand);
    
    if (shantenResult.shanten === -1) {
      console.log('テンパイ！（和了形）');
    } else if (shantenResult.shanten === 0) {
      console.log('テンパイ！');
    } else {
      console.log(`シャンテン数: ${shantenResult.shanten}`);
    }
    
    console.log(`手牌タイプ: ${this.getHandTypeName(shantenResult.handType)}`);
    
    // 有効牌を表示（テンパイしていない場合のみ）
    if (shantenResult.shanten > 0) {
      const effectiveResult = this.effectiveTilesCalculator.calculateEffectiveTiles(this.hand);
      
      if (effectiveResult.tiles.length > 0) {
        // 有効牌を種類別にグループ化
        const groupedTiles = this.groupTilesByType(effectiveResult.tiles);
        console.log(`有効牌: ${groupedTiles}`);
      } else {
        console.log('有効牌: なし');
      }
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

  private formatTile(tile: Tile): string {
    const str = tile.toString();
    
    // 赤ドラを赤色で表示
    if (tile.isRed) {
      return `\x1b[31m${str}\x1b[0m`;
    }
    
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
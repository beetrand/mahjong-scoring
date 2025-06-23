// シャンテン数検証プログラム - p_normal_10000.txtのデータを使用

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { ShantenCalculator } from '../tensuu/shanten-calculator';
import { createMockGameContext } from '../common/test-helpers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM対応: __dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 手牌データの構造
 */
interface HandData {
  tiles: number[];           // 14枚の牌インデックス（0-33）
  expectedShanten: number;   // 期待される通常シャンテン数
  expectedKokushi: number;   // 期待される国士無双シャンテン数
  expectedChitoitsu: number; // 期待される七対子シャンテン数
}

/**
 * 検証結果の構造
 */
interface ValidationResult {
  total: number;
  correct: number;
  regularCorrect: number;
  kokushiCorrect: number;
  chitoitsuCorrect: number;
  errors: Array<{
    line: number;
    tiles: string;
    expected: {
      regular: number;
      kokushi: number;
      chitoitsu: number;
    };
    actual: {
      regular: number;
      kokushi: number;
      chitoitsu: number;
    };
  }>;
}

/**
 * シャンテン数検証クラス
 */
export class ShantenValidator {
  private calculator: ShantenCalculator;
  private gameContext: ReturnType<typeof createMockGameContext>;

  constructor() {
    this.calculator = new ShantenCalculator();
    this.gameContext = createMockGameContext();
  }

  /**
   * ファイルからデータを読み込み
   */
  private loadDataFromFile(filePath: string): HandData[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    
    return lines.map(line => {
      const numbers = line.trim().split(/\s+/).map(n => parseInt(n));
      
      if (numbers.length !== 17) {
        throw new Error(`Invalid line format: expected 17 numbers, got ${numbers.length}`);
      }
      
      return {
        tiles: numbers.slice(0, 14),           // 最初の14個が牌
        expectedShanten: numbers[14],          // 15番目が通常シャンテン数
        expectedKokushi: numbers[15],          // 16番目が国士無双シャンテン数
        expectedChitoitsu: numbers[16]         // 17番目が七対子シャンテン数
      };
    });
  }

  /**
   * インデックス配列から手牌文字列を作成
   */
  private createHandString(tileIndices: number[]): string {
    const tiles = tileIndices.map(index => Tile.fromIndex(index));
    return tiles.map(tile => tile.toString()).join(' ');
  }

  /**
   * 単一手牌の検証
   */
  private validateSingleHand(handData: HandData, lineNumber: number): {
    correct: boolean;
    regularCorrect: boolean;
    kokushiCorrect: boolean;
    chitoitsuCorrect: boolean;
    result?: any;
  } {
    try {
      // インデックスから牌を作成
      const tiles = handData.tiles.map(index => Tile.fromIndex(index));
      
      // 最後の牌をツモ牌として設定
      const drawnTile = tiles[tiles.length - 1];
      
      // Handオブジェクトを作成
      const hand = new Hand(tiles, {
        drawnTile: drawnTile.toString(),
        isTsumo: true,
        gameContext: this.gameContext
      });

      // シャンテン数を計算
      const regularResult = this.calculator.calculateRegularShanten(hand);
      const kokushiShanten = this.calculator.calculateKokushiShanten(hand);
      const chitoitsuShanten = this.calculator.calculateChitoitsuShanten(hand);

      const regularCorrect = regularResult.shanten === handData.expectedShanten;
      const kokushiCorrect = kokushiShanten === handData.expectedKokushi;
      const chitoitsuCorrect = chitoitsuShanten === handData.expectedChitoitsu;
      const allCorrect = regularCorrect && kokushiCorrect && chitoitsuCorrect;

      return {
        correct: allCorrect,
        regularCorrect,
        kokushiCorrect,
        chitoitsuCorrect,
        result: {
          regular: regularResult.shanten,
          kokushi: kokushiShanten,
          chitoitsu: chitoitsuShanten
        }
      };
    } catch (error) {
      console.error(`Error processing line ${lineNumber}:`, error);
      return {
        correct: false,
        regularCorrect: false,
        kokushiCorrect: false,
        chitoitsuCorrect: false
      };
    }
  }

  /**
   * 全データの検証を実行
   */
  public validateFromFile(filePath: string, maxLines?: number): ValidationResult {
    const startTime = Date.now();
    console.log(`シャンテン数検証を開始: ${filePath}`);
    
    const handDataList = this.loadDataFromFile(filePath);
    const dataToProcess = maxLines ? handDataList.slice(0, maxLines) : handDataList;
    
    const result: ValidationResult = {
      total: dataToProcess.length,
      correct: 0,
      regularCorrect: 0,
      kokushiCorrect: 0,
      chitoitsuCorrect: 0,
      errors: []
    };

    let progressCount = 0;
    const reportInterval = Math.max(1, Math.floor(dataToProcess.length / 20)); // 5%ごとに進捗報告

    for (let i = 0; i < dataToProcess.length; i++) {
      const handData = dataToProcess[i];
      const validation = this.validateSingleHand(handData, i + 1);

      if (validation.correct) {
        result.correct++;
      }
      
      if (validation.regularCorrect) {
        result.regularCorrect++;
      }
      
      if (validation.kokushiCorrect) {
        result.kokushiCorrect++;
      }
      
      if (validation.chitoitsuCorrect) {
        result.chitoitsuCorrect++;
      }

      // エラーの場合は詳細を記録
      if (!validation.correct && validation.result) {
        result.errors.push({
          line: i + 1,
          tiles: this.createHandString(handData.tiles),
          expected: {
            regular: handData.expectedShanten,
            kokushi: handData.expectedKokushi,
            chitoitsu: handData.expectedChitoitsu
          },
          actual: {
            regular: validation.result.regular,
            kokushi: validation.result.kokushi,
            chitoitsu: validation.result.chitoitsu
          }
        });
      }

      // 進捗報告
      progressCount++;
      if (progressCount % reportInterval === 0) {
        const progress = Math.round((progressCount / dataToProcess.length) * 100);
        console.log(`進捗: ${progress}% (${progressCount}/${dataToProcess.length})`);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n=== シャンテン数検証結果 ===`);
    console.log(`処理時間: ${duration}ms`);
    console.log(`総件数: ${result.total}`);
    console.log(`全体正解率: ${result.correct}/${result.total} (${((result.correct / result.total) * 100).toFixed(2)}%)`);
    console.log(`通常手正解率: ${result.regularCorrect}/${result.total} (${((result.regularCorrect / result.total) * 100).toFixed(2)}%)`);
    console.log(`国士無双正解率: ${result.kokushiCorrect}/${result.total} (${((result.kokushiCorrect / result.total) * 100).toFixed(2)}%)`);
    console.log(`七対子正解率: ${result.chitoitsuCorrect}/${result.total} (${((result.chitoitsuCorrect / result.total) * 100).toFixed(2)}%)`);
    
    if (result.errors.length > 0) {
      console.log(`\n=== エラー詳細 (最初の10件) ===`);
      result.errors.slice(0, 10).forEach(error => {
        console.log(`Line ${error.line}: ${error.tiles}`);
        console.log(`  期待値: 通常=${error.expected.regular}, 国士=${error.expected.kokushi}, 七対=${error.expected.chitoitsu}`);
        console.log(`  実際値: 通常=${error.actual.regular}, 国士=${error.actual.kokushi}, 七対=${error.actual.chitoitsu}`);
        console.log('');
      });
      
      if (result.errors.length > 10) {
        console.log(`... 他 ${result.errors.length - 10} 件のエラー`);
      }
    }

    return result;
  }

  /**
   * 特定の行のデバッグ
   */
  public debugLine(filePath: string, lineNumber: number): void {
    const handDataList = this.loadDataFromFile(filePath);
    
    if (lineNumber < 1 || lineNumber > handDataList.length) {
      console.error(`Invalid line number: ${lineNumber} (1-${handDataList.length})`);
      return;
    }

    const handData = handDataList[lineNumber - 1];
    console.log(`\n=== Line ${lineNumber} Debug ===`);
    console.log(`牌インデックス: [${handData.tiles.join(', ')}]`);
    console.log(`牌表記: ${this.createHandString(handData.tiles)}`);
    console.log(`期待値: 通常=${handData.expectedShanten}, 国士=${handData.expectedKokushi}, 七対=${handData.expectedChitoitsu}`);
    
    const validation = this.validateSingleHand(handData, lineNumber);
    if (validation.result) {
      console.log(`実際値: 通常=${validation.result.regular}, 国士=${validation.result.kokushi}, 七対=${validation.result.chitoitsu}`);
      console.log(`正解: ${validation.correct ? 'YES' : 'NO'}`);
    }
  }
}

// メイン実行関数
export function runShantenValidation(maxLines?: number): ValidationResult {
  const validator = new ShantenValidator();
  const filePath = path.join(__dirname, '../../data/p_normal_10000.txt');
  
  try {
    return validator.validateFromFile(filePath, maxLines);
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}

// スタンドアロン実行時のエントリーポイント（ESM対応）
if (import.meta.url === `file://${process.argv[1]}`) {
  // コマンドライン引数で件数制限可能
  const maxLines = process.argv[2] ? parseInt(process.argv[2]) : undefined;
  runShantenValidation(maxLines);
}
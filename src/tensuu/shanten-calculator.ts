// 新しいシャンテン数計算統合クラス

import { Hand } from '../common/hand';
import { HandType } from '../common/types';
import { TileCount } from '../common/tile-count';
import { SUIT_RANGES, MAX_TILE_INDEX } from '../common/tile-constants';

import { Component, ComponentType } from '../common/component';

// 国士無双対象牌のインデックス（定数化）
const KOKUSHI_TERMINAL_INDICES = [
  SUIT_RANGES.MAN.start, SUIT_RANGES.MAN.end,    // 1m, 9m
  SUIT_RANGES.PIN.start, SUIT_RANGES.PIN.end,    // 1p, 9p  
  SUIT_RANGES.SOU.start, SUIT_RANGES.SOU.end,    // 1s, 9s
  ...Array.from({ length: SUIT_RANGES.HONOR.end - SUIT_RANGES.HONOR.start + 1 }, 
                 (_, i) => SUIT_RANGES.HONOR.start + i) // 1z-7z
] as const;

/**
 * 手牌の面子構成状態
 */
export interface MentsuComposition {
  mentsuCount: number;    // 面子数（刻子・順子）
  toitsuCount: number;    // 対子数
  taatsuCount: number;    // 搭子数
  components: Component[]; // 抽出したコンポーネント
}

// シャンテン分析結果（通常手のみ面子分解情報を含む）
export interface ShantenAnalysisResult {
  readonly shanten: number;
  readonly handType: HandType;
  
  // 通常手の場合のみ面子分解結果を含む
  readonly optimalStates?: MentsuComposition[];
}

/**
 * 通常手シャンテン計算の結果
 */
export interface RegularShantenResult {
  shanten: number;
  optimalCompositions: MentsuComposition[];  // 最適な面子構成配列
}

/**
 * シャンテン数計算統合クラス
 * 各計算機を統合
 */
/**
 * 面子分解計算コンテキスト
 */
interface MentsuAnalysisContext {
  minShanten: number;
  optimalCompositions: MentsuComposition[];
  debugMode: boolean;
}

export class ShantenCalculator {

  constructor() {
  }

  /**
   * 軽量シャンテン数計算（基本情報のみ）
   * 最も高速な計算で、シャンテン数のみを返す
   * @param excludeTsumoTile ツモ牌を除外するかどうか（デフォルト: false）
   */
  public calculateShantenNumber(hand: Hand, excludeTsumoTile: boolean = false): number {
    const result = this.calculateShanten(hand, excludeTsumoTile);
    return result.shanten;
  }

  /**
   * シャンテン分析（通常手のみ面子分解結果を含む）
   * 全ての手牌タイプを比較し、最適な結果を返す
   * @param hand 手牌オブジェクト（副露情報含む）
   * @param excludeTsumoTile ツモ牌を除外するかどうか（デフォルト: false）
   */
  public calculateShanten(hand: Hand, excludeTsumoTile: boolean = false): ShantenAnalysisResult {
    // 手牌情報を抽出
    const handTileCount = hand.getTileCount(excludeTsumoTile);
    const meldCount = hand.getMeldCount();
    const hasMelds = hand.hasMelds();
    
    // 全タイプのシャンテン数を計算
    const regularShantenResult = this.calculateRegularShanten(handTileCount, meldCount, false);
    const chitoitsuShanten = this.calculateChitoitsuShanten(handTileCount, hasMelds);
    const kokushiShanten = this.calculateKokushiShanten(handTileCount, hasMelds);

    // 最小シャンテン数とその手牌タイプを決定
    let bestShanten = regularShantenResult.shanten;
    let bestHandType: HandType = HandType.REGULAR;

    if (chitoitsuShanten < bestShanten) {
      bestShanten = chitoitsuShanten;
      bestHandType = HandType.CHITOITSU;
    }

    if (kokushiShanten < bestShanten) {
      bestShanten = kokushiShanten;
      bestHandType = HandType.KOKUSHI;
    }

    // 通常手の場合のみ詳細分解結果を含む
    if (bestHandType === HandType.REGULAR) {
      return {
        shanten: bestShanten,
        handType: bestHandType,
        optimalStates: regularShantenResult.optimalCompositions
      };
    } else {
      return {
        shanten: bestShanten,
        handType: bestHandType
      };
    }
  }

  /**
   * Hand オブジェクトが和了形かチェック
   * @param excludeTsumoTile ツモ牌を除外するかどうか（デフォルト: false）
   */
  public isWinningHand(hand: Hand, excludeTsumoTile: boolean = false): boolean {
    const result = this.calculateShanten(hand, excludeTsumoTile);
    return result.shanten === -1;
  }

  /**
   * 通常手のシャンテン数を計算（バックトラッキング版）
   * @param handTileCount 手牌の牌種別カウント
   * @param meldCount 副露面子数
   * @param debugLog デバッグログを出力するか
   * @return シャンテン数と最適な面子構成の候補リスト
   */
  public calculateRegularShanten(handTileCount: TileCount, meldCount: number, debugLog: boolean = false): RegularShantenResult {
    
    // 面子分解コンテキストを作成（スレッドセーフ）
    const context: MentsuAnalysisContext = {
      minShanten: 8,
      optimalCompositions: [],
      debugMode: debugLog
    };
    
    if (context.debugMode) {
      console.log(`\n=== バックトラッキング開始 ===`);
      console.log(`手牌: ${this.tileCountToString(handTileCount)}`);
      console.log(`副露面子数: ${meldCount}`);
    }
    
    const initialState: MentsuComposition = {
      mentsuCount: meldCount,
      toitsuCount: 0,
      taatsuCount: 0,
      components: []
    };
    
    // バックトラッキング開始
    this.backtrack(handTileCount.clone(), 0, initialState, context);
    
    if (context.debugMode) {
      this.outputDebugResults(context);
    }
    
    // 結果を返す
    return {
      shanten: context.minShanten,
      optimalCompositions: [...context.optimalCompositions] // 最適な状態をコピー
    };
  }

  /**
   * バックトラッキング
   * 面子・対子・搭子を同時に最適化
   */
  private backtrack(tiles: TileCount, position: number, state: MentsuComposition, context: MentsuAnalysisContext): void {
    // 全ての位置を処理済み
    if (position > MAX_TILE_INDEX) {
      // 残り牌を孤立牌として追加（常に実行）
      this.addRemainingTilesToState(tiles, state);
      this.evaluateState(tiles, state, context);
      this.removeRemainingTilesFromState(tiles, state);
      return;
    }
    
    const count = tiles.getCount(position);
    if (count === 0) {
      // この位置に牌がない場合は次へ
      this.backtrack(tiles, position + 1, state, context);
      return;
    }
    
    // 1. 刻子（3枚）を試す
    if (count >= 3 && state.mentsuCount < 4) {
      tiles.decrement(position, 3);
      state.mentsuCount++;
      state.components.push(Component.create(ComponentType.TRIPLET, [position, position, position]));
      this.backtrack(tiles, position, state, context);
      // バックトラッキング: 状態を復元
      state.components.pop();
      state.mentsuCount--;
      tiles.increment(position, 3);
    }
    
    // 2. 順子（連続3枚）を試す
    if (position < 27 && this.canFormShuntsu(position) && state.mentsuCount < 4 &&
      tiles.getCount(position) >= 1 && tiles.getCount(position + 1) >= 1 &&  tiles.getCount(position + 2) >= 1) {
        
        tiles.decrement(position); tiles.decrement(position + 1); tiles.decrement(position + 2);
        state.mentsuCount++;
        state.components.push(Component.create(ComponentType.SEQUENCE, [position, position + 1, position + 2]));
        this.backtrack(tiles, position, state, context);
        // バックトラッキング: 状態を復元
        state.components.pop();
        state.mentsuCount--;
        tiles.increment(position); tiles.increment(position + 1); tiles.increment(position + 2);
    }
    
    // 3. 対子（2枚）を試す
    if (count >= 2) {
      tiles.decrement(position, 2);
      state.toitsuCount++;
      state.components.push(Component.create(ComponentType.PAIR, [position, position]));
      this.backtrack(tiles, position, state, context);
      // バックトラッキング: 状態を復元
      state.components.pop();
      state.toitsuCount--;
      tiles.increment(position, 2);
    }
    
    // 4. 隣接搭子（連続2枚）を試す
    if (position < 27 && this.canFormTaatsu(position) &&
      tiles.getCount(position) >= 1 && tiles.getCount(position + 1) >= 1) {
        tiles.decrement(position); tiles.decrement(position + 1);
        state.taatsuCount++;
        state.components.push(Component.create(ComponentType.TAATSU, [position, position + 1]));
        this.backtrack(tiles, position, state, context);
        // バックトラッキング: 状態を復元
        state.components.pop();
        state.taatsuCount--;
        tiles.increment(position); tiles.increment(position + 1);
    }
    
    // 5. 嵌張搭子（間隔2枚）を試す
    if (position < 27 && this.canFormKanchan(position) &&
      tiles.getCount(position) >= 1 && tiles.getCount(position + 2) >= 1) {
        tiles.decrement(position); tiles.decrement(position + 2);
        state.taatsuCount++;
        state.components.push(Component.create(ComponentType.TAATSU, [position, position + 2]));
        this.backtrack(tiles, position, state, context);
        // バックトラッキング: 状態を復元
        state.components.pop();
        state.taatsuCount--;
        tiles.increment(position); tiles.increment(position + 2);
    }
    
    // 6. 何も取らずに次へ
    this.backtrack(tiles, position + 1, state, context);
  }

  /**
   * 現在の状態を評価してシャンテン数を計算
   */
  private evaluateState(_tiles: TileCount, state: MentsuComposition, context: MentsuAnalysisContext): void {
    const mentsu = state.mentsuCount;
    const toitsu = state.toitsuCount;
    const taatsu = state.taatsuCount;
    
    // 雀頭の判定（より厳密なロジック）
    const jantouCount = toitsu > 0 && (taatsu + toitsu - 1) >= (4 - mentsu) ? 1 : 0;
    
    // usefulGroupsは純粋に面子候補のみ（4面子まで）
    const usefulGroups = Math.min(taatsu + toitsu, 4 - mentsu);
    
    //シャンテン数計算
    let shanten = 8 - (mentsu * 2) - usefulGroups - jantouCount;
    
    shanten = Math.max(shanten, -1);
    
    // 最適解の更新（常に状態保存）
    if (shanten < context.minShanten) {
      context.minShanten = shanten;
      context.optimalCompositions = [this.cloneState(state)];
    } else if (shanten === context.minShanten) {
      // 重複チェック: 同じComponent配列が既に存在するかチェック
      const isDuplicate = context.optimalCompositions.some(existingState => 
        Component.areComponentArraysEqual(existingState.components, state.components)
      );
      
      if (!isDuplicate) {
        context.optimalCompositions.push(this.cloneState(state));
      }
    }
  }

  /**
   * 状態のクローン
   */
  private cloneState(state: MentsuComposition): MentsuComposition {
    return {
      mentsuCount: state.mentsuCount,
      toitsuCount: state.toitsuCount,
      taatsuCount: state.taatsuCount,
      components: [...state.components]
    };
  }

  /**
   * 順子を形成可能かチェック（スート境界考慮）
   */
  private canFormShuntsu(position: number): boolean {
    return (position <= 6) || 
           (position >= 9 && position <= 15) || 
           (position >= 18 && position <= 24);
  }

  /**
   * 搭子を形成可能かチェック（隣接）
   */
  private canFormTaatsu(position: number): boolean {
    return (position <= 7) || 
           (position >= 9 && position <= 16) || 
           (position >= 18 && position <= 25);
  }

  /**
   * 嵌張搭子を形成可能かチェック
   */
  private canFormKanchan(position: number): boolean {
    return (position <= 6) || 
           (position >= 9 && position <= 15) || 
           (position >= 18 && position <= 24);
  }

  /**
   * 残り牌を孤立牌として状態に追加（デバッグ時のみ）
   */
  private addRemainingTilesToState(tiles: TileCount, state: MentsuComposition): void {
    // 残った牌を孤立牌として追加
    for (let i = 0; i < 34; i++) {
      const count = tiles.getCount(i);
      for (let j = 0; j < count; j++) {
        state.components.push(Component.create(ComponentType.ISOLATED, [i]));
      }
    }
  }

  /**
   * 残り牌を孤立牌として状態から削除（デバッグ時のみ）
   */
  private removeRemainingTilesFromState(tiles: TileCount, state: MentsuComposition): void {
    // 残った牌の数だけpop
    for (let i = 0; i < 34; i++) {
      const count = tiles.getCount(i);
      for (let j = 0; j < count; j++) {
        state.components.pop();
      }
    }
  }

  /**
   * TileCountを文字列表現に変換
   */
  private tileCountToString(tileCount: TileCount): string {
    const tiles: string[] = [];
    for (let i = 0; i < 34; i++) {
      const count = tileCount.getCount(i);
      for (let j = 0; j < count; j++) {
        tiles.push(this.indexToTileString(i));
      }
    }
    return tiles.join(' ');
  }

  /**
   * インデックスから牌文字列に変換
   */
  private indexToTileString(index: number): string {
    if (index < 9) return `${index + 1}m`;
    if (index < 18) return `${index - 8}p`;
    if (index < 27) return `${index - 17}s`;
    const honor = index - 27 + 1;
    return `${honor}z`;
  }

  /**
   * デバッグ結果の出力
   */
  private outputDebugResults(context: MentsuAnalysisContext): void {
    console.log(`\n=== バックトラッキング結果 ===`);
    console.log(`最小シャンテン数: ${context.minShanten}`);
    console.log(`最適パターン数: ${context.optimalCompositions.length} (重複除去済み)`);
    
    if (context.optimalCompositions.length > 0) {
      console.log(`\n=== 最適パターン詳細 ===`);
      context.optimalCompositions.slice(0, 3).forEach((state, index) => {
        console.log(`\n--- パターン ${index + 1} ---`);
        console.log(`面子数: ${state.mentsuCount}, 対子数: ${state.toitsuCount}, 搭子数: ${state.taatsuCount}`);
        
        // 面子の表示
        const mentsu = state.components.filter(c => c.isCompleteMentsu());
        if (mentsu.length > 0) {
          console.log(`面子: ${mentsu.map(c => c.toString()).join(' ')}`);
        }
        
        // 雀頭（対子）の表示
        const pairs = state.components.filter(c => c.type === ComponentType.PAIR);
        if (pairs.length > 0) {
          console.log(`対子: ${pairs.map(c => c.toString()).join(' ')}`);
        }
        
        // 搭子の表示
        const taatsu = state.components.filter(c => c.type === ComponentType.TAATSU);
        if (taatsu.length > 0) {
          console.log(`搭子: ${taatsu.map(c => c.toString()).join(' ')}`);
        }
        
        // 孤立牌の表示
        const isolated = state.components.filter(c => c.type === ComponentType.ISOLATED);
        if (isolated.length > 0) {
          console.log(`孤立牌: ${isolated.map(c => c.toString()).join(' ')}`);
        }
      });
      
      if (context.optimalCompositions.length > 3) {
        console.log(`\n... 他 ${context.optimalCompositions.length - 3} パターン`);
      }
    }
    
    console.log(`=== デバッグ終了 ===\n`);
  }


  /**
   * 七対子のシャンテン数を計算
   * @param handTileCount 手牌の牌種別カウント
   * @param hasMelds 副露があるかどうか
   */
  public calculateChitoitsuShanten(handTileCount: TileCount, hasMelds: boolean): number {
    // 副露がある場合は七対子は成立しない
    if (hasMelds) {
      return Infinity;
    }
    
    let pairs = 0;      // 対子の数
    
    // 各牌種について分析
    for (let i = 0; i < 34; i++) {
      const count = handTileCount.getCount(i);
        if (count >= 2) {
          pairs++;
        }
    }
    
    // 基本シャンテン数：7対子 - 現在の対子数
    let shanten = 6 - pairs;
    
    return Math.max(shanten, -1);
  }

  /**
   * 国士無双のシャンテン数を計算
   * @param handTileCount 手牌の牌種別カウント
   * @param hasMelds 副露があるかどうか
   */
  public calculateKokushiShanten(handTileCount: TileCount, hasMelds: boolean): number {
    // 副露がある場合は国士無双は成立しない
    if (hasMelds) {
      return Infinity;
    }
    
    let kinds = 0;  // 異なり種類数
    let toitsu = 0;  // 対子数

    for (const index of KOKUSHI_TERMINAL_INDICES) {
      const count = handTileCount.getCount(index);
      if (count >= 1) {
        kinds++;
        if (count >= 2) {
          toitsu++;
        }
      }
    }

    // 13種類揃っている場合
    if (kinds >= 13) {
      return toitsu >= 1 ? -1 : 0; // 対子があれば和了、なければテンパイ
    }

    // 13種類未満の場合
    return 13 - kinds - (toitsu > 0 ? 1 : 0);
  }

}

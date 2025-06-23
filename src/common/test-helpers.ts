// テスト用ヘルパー関数 - 型安全なモック作成
import type { GameContext, HandOptions } from './types';
import { TileSuit, Wind, Dragon } from './types';
import { Tile } from './tile';

/**
 * 型安全なGameContextモック作成
 */
export function createMockGameContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    roundWind: Wind.EAST,
    playerWind: Wind.EAST,
    doraIndicators: [],
    uraDoraIndicators: [],
    hasRedDora: false,
    ...overrides
  };
}

/**
 * 型安全なHandOptionsモック作成
 */
export function createMockHandOptions(overrides: Partial<HandOptions> = {}): HandOptions {
  return {
    drawnTile: '1m',
    isTsumo: true,
    isRiichi: false,
    gameContext: createMockGameContext(),
    ...overrides
  };
}

/**
 * 型安全な数牌作成
 */
export function createManTile(value: number, isRed = false): Tile {
  return new Tile(`${value}m${isRed ? 'r' : ''}`);
}

export function createPinTile(value: number, isRed = false): Tile {
  return new Tile(`${value}p${isRed ? 'r' : ''}`);
}

export function createSouTile(value: number, isRed = false): Tile {
  return new Tile(`${value}s${isRed ? 'r' : ''}`);
}

/**
 * 型安全な風牌作成
 */
export function createWindTile(wind: keyof typeof Wind): Tile {
  return new Tile(`${Wind[wind]}z`);
}

/**
 * 型安全な三元牌作成
 */
export function createDragonTile(dragon: keyof typeof Dragon): Tile {
  return new Tile(`${Dragon[dragon] + 4}z`);
}

/**
 * 手牌文字列から型安全にTile配列を作成
 */
export function createTilesFromString(tilesStr: string): Tile[] {
  return Tile.fromStringArray(tilesStr.split(' ').filter(s => s.length > 0));
}

/**
 * テスト用の標準的な手牌パターン
 */
export const TEST_HANDS = {
  /** 完成形: 123m456p789s11z */
  COMPLETE_HAND: '123m456p789s11z',
  
  /** テンパイ: 123m456p789s1z */
  TENPAI_HAND: '123m456p789s1z',
  
  /** 七対子テンパイ: 1122m3344p5566s1z */
  CHITOITSU_TENPAI: '1122m3344p5566s1z',
  
  /** 国士無双テンパイ: 19m19p19s1234567z */
  KOKUSHI_TENPAI: '19m19p19s1234567z',
  
  /** 2シャンテン: 123m45p67s12345z */
  TWO_SHANTEN: '123m45p67s12345z'
} as const;

/**
 * 型ガード: オブジェクトがGameContextかチェック
 */
export function isGameContext(obj: unknown): obj is GameContext {
  return obj !== null && 
    typeof obj === 'object' &&
    'roundWind' in obj &&
    'playerWind' in obj &&
    typeof (obj as GameContext).roundWind === 'number' &&
    typeof (obj as GameContext).playerWind === 'number' &&
    Array.isArray((obj as GameContext).doraIndicators) &&
    Array.isArray((obj as GameContext).uraDoraIndicators) &&
    typeof (obj as GameContext).hasRedDora === 'boolean';
}

/**
 * 型ガード: オブジェクトがHandOptionsかチェック
 */
export function isHandOptions(obj: unknown): obj is HandOptions {
  return obj !== null &&
    typeof obj === 'object' &&
    'drawnTile' in obj &&
    'isTsumo' in obj &&
    'gameContext' in obj &&
    typeof (obj as HandOptions).drawnTile === 'string' &&
    typeof (obj as HandOptions).isTsumo === 'boolean' &&
    isGameContext((obj as HandOptions).gameContext) &&
    true; // HandOptions no longer has openMelds property
}

/**
 * テスト用アサーション関数
 */
export function expectTileEqual(actual: Tile, expected: { suit: string, value: number, isRed?: boolean }): void {
  expect(actual.suit).toBe(expected.suit);
  expect(actual.value).toBe(expected.value);
  expect(actual.isRed).toBe(expected.isRed || false);
}

// スートの定数をエクスポート（テストで使用）
export const SUITS = {
  MAN: TileSuit.MAN,
  PIN: TileSuit.PIN, 
  SOU: TileSuit.SOU,
  WIND: TileSuit.WIND,
  DRAGON: TileSuit.DRAGON
} as const;

/**
 * 期待される牌配列との比較
 */
export function expectTileArrayEqual(actual: Tile[], expected: string[]): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    expect(actual[i].toString()).toBe(expected[i]);
  }
}
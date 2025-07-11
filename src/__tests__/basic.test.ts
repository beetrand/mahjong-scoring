// 基本機能のテスト

import { Tile } from '../common/tile';
import { Hand } from '../common/hand';
import { HandParser } from '../common/hand-parser';
import { Component } from '../common/component';
import { MahjongScorer, createGameContext } from '../index';
import { 
  createManTile,
  createPinTile,
  createSouTile,
  createDragonTile,
  createWindTile,
  expectTileEqual,
  SUITS
} from '../common/test-helpers';

describe('Tile クラス', () => {
  test('数牌の作成', () => {
    const tile = createManTile(1);
    expect(tile.suit).toBe(SUITS.MAN);
    expect(tile.value).toBe(1);
    expect(tile.isRed).toBe(false);
    expect(tile.toString()).toBe('1m');
  });

  test('字牌の作成', () => {
    const eastTile = createWindTile('EAST');
    expect(eastTile.toString()).toBe('1z');
    
    const whiteTile = createDragonTile('WHITE');
    expect(whiteTile.toString()).toBe('5z');
  });

  test('赤ドラの作成', () => {
    const redFive = createPinTile(5, true);
    expect(redFive.isRed).toBe(true);
    expect(redFive.toString()).toBe('5pr');
  });

  test('文字列からの作成', () => {
    const tile1 = Tile.fromString('1m');
    expectTileEqual(tile1, { suit: SUITS.MAN, value: 1 });

    const tile2 = Tile.fromString('5pr');
    expect(tile2.isRed).toBe(true);

    const tile3 = Tile.fromString('1z');
    expectTileEqual(tile3, { suit: SUITS.WIND, value: 1 });
  });

  test('z記法の字牌作成', () => {
    // 風牌のテスト
    const east = Tile.fromString('1z');
    expectTileEqual(east, { suit: SUITS.WIND, value: 1 });
    expect(east.toString()).toBe('1z');

    const south = Tile.fromString('2z');
    expectTileEqual(south, { suit: SUITS.WIND, value: 2 });
    expect(south.toString()).toBe('2z');

    const west = Tile.fromString('3z');
    expectTileEqual(west, { suit: SUITS.WIND, value: 3 });
    expect(west.toString()).toBe('3z');

    const north = Tile.fromString('4z');
    expectTileEqual(north, { suit: SUITS.WIND, value: 4 });
    expect(north.toString()).toBe('4z');

    // 三元牌のテスト
    const white = Tile.fromString('5z');
    expectTileEqual(white, { suit: SUITS.DRAGON, value: 1 });
    expect(white.toString()).toBe('5z');

    const green = Tile.fromString('6z');
    expectTileEqual(green, { suit: SUITS.DRAGON, value: 2 });
    expect(green.toString()).toBe('6z');

    const red = Tile.fromString('7z');
    expectTileEqual(red, { suit: SUITS.DRAGON, value: 3 });
    expect(red.toString()).toBe('7z');
  });


  test('手牌文字列の解析', () => {
    const tiles = HandParser.parseHandString('123m456p789s11z');
    expect(tiles).toHaveLength(11);
    expect(tiles[0].toString()).toBe('1m');
    expect(tiles[9].toString()).toBe('1z');
  });

  test('z記法を含む手牌文字列の解析', () => {
    // z記法のみ
    const tiles1 = HandParser.parseHandString('123m456p789s1122z');
    expect(tiles1).toHaveLength(12);
    expect(tiles1[9].toString()).toBe('1z'); // 1z
    expect(tiles1[10].toString()).toBe('1z'); // 1z
    expect(tiles1[11].toString()).toBe('2z'); // 2z

    // 全種類の字牌
    const tiles3 = HandParser.parseHandString('1234567z');
    expect(tiles3).toHaveLength(7);
    expect(tiles3[0].toString()).toBe('1z'); // 1z
    expect(tiles3[1].toString()).toBe('2z'); // 2z
    expect(tiles3[2].toString()).toBe('3z'); // 3z
    expect(tiles3[3].toString()).toBe('4z'); // 4z
    expect(tiles3[4].toString()).toBe('5z'); // 5z
    expect(tiles3[5].toString()).toBe('6z'); // 6z
    expect(tiles3[6].toString()).toBe('7z'); // 7z
  });

  test('牌の判定メソッド', () => {
    const simpleTile = createManTile(5);
    expect(simpleTile.isSimple()).toBe(true);
    expect(simpleTile.isTerminal()).toBe(false);
    expect(simpleTile.isHonor()).toBe(false);

    const terminalTile = createPinTile(9);
    expect(terminalTile.isTerminal()).toBe(true);
    expect(terminalTile.isSimple()).toBe(false);

    const honorTile = createWindTile('EAST');
    expect(honorTile.isHonor()).toBe(true);
    expect(honorTile.isWind()).toBe(true);
  });
});

describe('Component クラス', () => {
  test('順子の作成', () => {
    const tiles = [
      createManTile(1),
      createManTile(2),
      createManTile(3)
    ];
    const sequence = Component.createSequence(tiles as [Tile, Tile, Tile]);
    expect(sequence.type).toBe('sequence');
    expect(sequence.tiles).toHaveLength(3);
    expect(sequence.isSimple()).toBe(false); // 1mが含まれるため
  });

  test('刻子の作成', () => {
    const tiles = [
      createPinTile(5),
      createPinTile(5),
      createPinTile(5)
    ];
    const triplet = Component.createTriplet(tiles as [Tile, Tile, Tile]);
    expect(triplet.type).toBe('triplet');
    expect(triplet.isSimple()).toBe(true);
  });

  test('対子の作成', () => {
    const tiles = [
      createDragonTile('RED'),
      createDragonTile('RED')
    ];
    const pair = Component.createPair(tiles as [Tile, Tile]);
    expect(pair.type).toBe('pair');
    expect(pair.isTerminalOrHonor()).toBe(true);
  });

  test('自動面子作成', () => {
    const sequenceTiles = [
      createSouTile(7),
      createSouTile(8),
      createSouTile(9)
    ];
    const meld = Component.fromTiles(sequenceTiles);
    expect(meld.type).toBe('sequence');
  });
});

describe('MahjongScorer 基本機能', () => {
  let scorer: MahjongScorer;
  let gameContext: ReturnType<typeof createGameContext>;

  beforeEach(() => {
    scorer = new MahjongScorer();
    gameContext = createGameContext(1, 1); // 東場、東家
  });

  test('シャンテン数計算', () => {
    const hand = Hand.fromString('123m456p789s1122z', {
      drawnTile: '2z',
      isTsumo: true,
      gameContext
    });
    const result = scorer.calculateShanten(hand);
    expect(result.shanten).toBeGreaterThanOrEqual(0);
  });

  test('和了形の判定', () => {
    const hand = Hand.fromString('123m456p789s1122z1m', {
      drawnTile: '1m',
      isTsumo: true,
      gameContext
    });
    const isWinning = scorer.isWinningHand(hand);
    expect(isWinning).toBe(true);
  });

  test('基本的な点数計算', () => {
    // ツモ平和のテスト（14枚）
    const result = scorer.scoreHandFromString(
      '123m456p789s1122z3m', // 14枚の手牌
      '3m',
      true, // ツモ
      gameContext,
      { isRiichi: true }
    );

    expect(result.getTotalHan()).toBeGreaterThan(0);
    expect(result.getFinalScore()).toBeGreaterThan(0);
    expect(result.getDisplayString()).toContain('翻');
  });

  test('役なしでエラー', () => {
    expect(() => {
      scorer.scoreHandFromString(
        '123m456p789s1122z3m', // 14枚の手牌
        '3m',
        false, // ロン
        gameContext,
        { isRiichi: false } // リーチなし
      );
    }).toThrow();
  });
});

describe('点数計算システム', () => {
  let scorer: MahjongScorer;
  let gameContext: ReturnType<typeof createGameContext>;

  beforeEach(() => {
    scorer = new MahjongScorer();
    gameContext = createGameContext(1, 1);
  });

  test('満貫の計算', () => {
    // 5翻以上で満貫
    const result = scorer.scoreHandFromString(
      '123m456p789s1122z3m', // 14枚の手牌
      '3m',
      true,
      gameContext,
      { 
        isRiichi: true,
        bonuses: { riichiSticks: 1, honbaSticks: 2 }
      }
    );

    expect(result.paymentResult.bonusPayment).toBe(1600); // 1000 + 600
  });

  test('支払い計算', () => {
    const result = scorer.scoreHandFromString(
      '123m456p789s1122z3m', // 14枚の手牌
      '3m',
      true,
      gameContext,
      { isRiichi: true }
    );

    expect(result.paymentResult.totalPayment).toBeGreaterThan(0);
    expect(result.paymentResult.bonusPayment).toBe(0);
  });
});
import { Tile } from './tile';

export class TileGenerator {
  private static readonly ALL_TILES = TileGenerator.createAllTiles();

  private static createAllTiles(): Tile[] {
    const tiles: Tile[] = [];
    
    // 数牌: 萬子、筒子、索子 (1-9) x 4枚ずつ
    ['man', 'pin', 'sou'].forEach(suit => {
      for (let value = 1; value <= 9; value++) {
        for (let count = 0; count < 4; count++) {
          const isRed = suit !== 'sou' && value === 5 && count === 0; // 赤ドラは5萬と5筒の1枚目
          tiles.push(new Tile(`${value}${suit.charAt(0)}${isRed ? 'r' : ''}`));
        }
      }
    });
    
    // 字牌: 風牌(1-4z) + 三元牌(5-7z) x 4枚ずつ
    for (let value = 1; value <= 7; value++) {
      for (let count = 0; count < 4; count++) {
        tiles.push(new Tile(`${value}z`));
      }
    }
    
    return tiles;
  }

  public static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public static createShuffledDeck(): Tile[] {
    return this.shuffle(this.ALL_TILES);
  }

  public static generateRandomHand(tileCount: number = 13): Tile[] {
    const deck = this.createShuffledDeck();
    return deck.slice(0, tileCount);
  }

  public static createMountain(excludeTiles: Tile[] = []): Tile[] {
    const availableTiles = this.ALL_TILES.filter(tile => {
      const usedCount = excludeTiles.filter(used => used.equals(tile)).length;
      const totalCount = this.ALL_TILES.filter(all => all.equals(tile)).length;
      return usedCount < totalCount;
    });
    
    return this.shuffle(availableTiles);
  }

  public static drawFromMountain(mountain: Tile[]): Tile | null {
    return mountain.pop() || null;
  }
}
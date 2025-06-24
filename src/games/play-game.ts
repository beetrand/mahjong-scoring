import { SimpleMahjongGame } from './simple-mahjong-game';

async function main() {
  const game = new SimpleMahjongGame();
  await game.start();
}

main().catch(console.error);
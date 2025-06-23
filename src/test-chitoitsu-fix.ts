import { MahjongScorer, createGameContext } from './index';

const scorer = new MahjongScorer();
const gameContext = createGameContext(1, 1);

// 七対子エラーの手牌をテスト
const testHands = [
  {
    description: "Line 11",
    hai: "344m56m8999p9p23s1z1z",
    tsumo: "1z",
    expectedChitoitsu: 3
  },
  {
    description: "Line 13", 
    hai: "1m56m123p6p1s11z1z34z5z",
    tsumo: "5z",
    expectedChitoitsu: 5
  },
  {
    description: "Line 21",
    hai: "222m33m44m12p7p23s2z4z",
    tsumo: "4z", 
    expectedChitoitsu: 3
  }
];

console.log('七対子シャンテン修正テスト\n');

testHands.forEach((testHand) => {
  const result = scorer.calculateShantenFromString(testHand.hai, testHand.tsumo, gameContext);
  
  console.log(`${testHand.description}: ${testHand.hai}`);
  console.log(`期待値: ${testHand.expectedChitoitsu}, 実際値: ${result.chitoitsuShanten}`);
  console.log(`結果: ${result.chitoitsuShanten === testHand.expectedChitoitsu ? '✓' : '✗'}\n`);
});
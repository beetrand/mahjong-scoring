import { MahjongScorer, createGameContext } from './index';

const scorer = new MahjongScorer();
const gameContext = createGameContext(1, 1); // 東場、東家
// 例4: シャンテン数計算
console.log('シャンテン数計算');
const testHands = [
{ hai: "359m267p13558s456z", tsumo: "6z" },
{ hai: "4556m33p2234457s1z", tsumo: "1z" },
{ hai: "139m134689p246s3z6z", tsumo: "6z" },
];

testHands.forEach((testHand, index) => {
const shantenResult = scorer.calculateShantenFromString(testHand.hai, testHand.tsumo, gameContext);
console.log(`手牌${index + 1}: ${testHand.hai}`);
console.log(`通常手シャンテン: ${shantenResult.regularShanten}`);
console.log(`七対子シャンテン: ${shantenResult.chitoitsuShanten}`);
console.log(`国士シャンテン: ${shantenResult.kokushiShanten}`);
console.log(`最小シャンテン: ${shantenResult.shanten}`);
console.log(`最適な手の形: ${shantenResult.handType}\n`);
});
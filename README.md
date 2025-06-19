# 麻雀点数計算システム

TypeScript製の麻雀点数計算ライブラリです。手牌から自動的に役を判定し、符・翻数・支払い点数を計算します。

## ✨ 特徴

- 🎯 **完全な役判定**: 10種類の基本役を実装済み
- 🧮 **正確な点数計算**: 符計算・翻数計算・支払い計算
- 📊 **シャンテン数計算**: 通常手・七対子・国士無双対応
- 🔧 **拡張可能設計**: 新しい役・ルールの追加が容易
- 🛡️ **型安全**: TypeScriptの型システムで安全性を確保
- 🚀 **高性能**: 効率的なアルゴリズムで高速計算

## 🚀 クイックスタート

### インストール

```bash
git clone <repository-url>
cd mahjong-scoring
npm install
```

### 基本的な使用方法

```typescript
import { MahjongScorer, createGameContext } from './src';

// スコアラーの初期化
const scorer = new MahjongScorer();
const gameContext = createGameContext(1, 1); // 東場、東家

// 点数計算の実行
const result = scorer.scoreHandFromString(
  '234m567p345s2233p', // 手牌
  '4p',                 // 和了牌
  true,                 // ツモ
  gameContext,
  { isRiichi: true }
);

// 結果の表示
console.log(result.getDisplayString());
// → "リーチ・ツモ・平和・断幺九 4翻30符 7700点"
```

### シャンテン数計算

```typescript
// シャンテン数の計算
const shanten = scorer.calculateShantenFromString('123m456p78s1122z');

console.log(`シャンテン数: ${shanten.minimumShanten}`);
console.log(`最適な手の形: ${shanten.bestHandType}`);
```

## 📖 API ドキュメント

### MahjongScorer

主要なスコアリングクラスです。

#### メソッド

- `scoreHandFromString(tilesStr, winningTile, isTsumo, gameContext, options)`: 文字列から点数計算
- `calculateShantenFromString(tilesStr)`: 文字列からシャンテン数計算
- `scoreHand(hand, bonuses)`: Handオブジェクトから点数計算
- `calculateShanten(tiles)`: Tileオブジェクトからシャンテン数計算

### 手牌文字列の形式

```
数牌: 1-9 + m/p/s (萬子/筒子/索子)
字牌: 東南西北白發中
赤ドラ: 5mr, 5pr, 5sr

例: "123m456p789s東東"
```

### GameContext

ゲーム状況を表す設定オブジェクトです。

```typescript
const gameContext = createGameContext(
  1,      // 場風（1=東, 2=南, 3=西, 4=北）
  1,      // 自風（1=東, 2=南, 3=西, 4=北）
  ['5m'], // ドラ表示牌
  [],     // 裏ドラ表示牌
  true    // 赤ドラあり
);
```

## 🎲 対応機能

### 実装済み役

| 翻数 | 役名 |
|------|------|
| 1翻 | リーチ、ツモ、平和、断幺九、役牌 |
| 2翻 | 七対子、一気通貫、三暗刻 |
| 役満 | 国士無双、四暗刻、大三元 |

### 対応する手の形

- **通常手**: 4面子1雀頭（順子・刻子・槓子）
- **七対子**: 7つの対子
- **国士無双**: 13種類の幺九牌+1つの対子

### 点数計算

- 符計算（基本符・面子符・待ち符・和了符）
- 翻数計算（役の合計・ドラ）
- 満貫以上の判定（満貫〜役満）
- 支払い計算（ツモ/ロン、親/子、ボーナス点）

### シャンテン数計算

- 通常手シャンテン数
- 七対子シャンテン数
- 国士無双シャンテン数
- 最適な手の形の自動選択

## 🔧 拡張方法

### 新しい役の追加

```typescript
import { Yaku, MeldCombination, YakuContext } from './src';

class MyCustomYaku extends Yaku {
  public readonly name = 'カスタム役';
  public readonly hanValue = 2;
  public readonly isYakuman = false;

  public isApplicable(combination: MeldCombination, context: YakuContext): boolean {
    // 役の判定ロジックを実装
    return true;
  }
}

// YakuDetectorに追加
yakuDetector.addYaku(new MyCustomYaku());
```

### カスタムルールの対応

```typescript
// 特殊なゲーム設定
const customContext = createGameContext(
  2,          // 南場
  3,          // 西家
  ['1m', '5s'], // 複数ドラ
  ['7p'],     // 裏ドラ
  true        // 赤ドラあり
);
```

## 🧪 テスト

```bash
# テストの実行
npm test

# ビルド
npm run build

# 使用例の実行
npm run example
```

## 📁 プロジェクト構造

```
src/
├── types.ts              # 型定義
├── tile.ts               # 牌クラス
├── meld.ts               # 面子クラス
├── hand-analyzer.ts      # 手牌解析
├── shanten-calculator.ts # シャンテン数計算
├── yaku.ts               # 役判定システム
├── scoring.ts            # 点数計算システム
├── mahjong-scorer.ts     # 統合スコアラー
├── index.ts              # メインエクスポート
└── example.ts            # 使用例
```

## 🐛 既知の制限

- 現在10種類の役のみ実装（拡張予定）
- 一部の特殊ルール（ローカルルール）は未対応
- 鳴きの詳細処理は簡略化

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License

## 🔗 関連リンク

- [設計ドキュメント](./SYSTEM_DESIGN.md)
- [API リファレンス](./src/index.ts)
- [使用例](./src/example.ts)

---

**⚡ 高速で正確な麻雀点数計算をお楽しみください！**
import type { BasePieceType, PieceType } from "./types";

export interface PieceInfo {
  type: PieceType;
  kanji: string;
  reading: string;
  name: string;
  /** Beginner-friendly one/two sentence explanation of how the piece moves. */
  description: string;
  /** For a promoted piece, the base type it promotes from. */
  promotesFrom?: BasePieceType;
}

/** The 8 pieces every player starts the game with (in the order they're usually introduced to beginners). */
export const BASE_PIECE_ORDER: BasePieceType[] = ["OU", "HI", "KA", "KI", "GI", "KE", "KY", "FU"];

export const PIECE_INFO: Record<PieceType, PieceInfo> = {
  OU: {
    type: "OU",
    kanji: "玉",
    reading: "ぎょく／おう",
    name: "王将・玉将",
    description:
      "縦・横・ななめの全8方向に1マスずつ動けます。一番大事な駒で、逃げ場がなくなったら負けです。詰将棋はこの駒を追い詰めるパズルです。",
  },
  HI: {
    type: "HI",
    kanji: "飛",
    reading: "ひしゃ",
    name: "飛車",
    description: "縦と横の4方向に、駒がぶつかるまで何マスでも進めます。盤上で一番強い駒の一つです。",
  },
  KA: {
    type: "KA",
    kanji: "角",
    reading: "かくぎょう",
    name: "角行",
    description: "ななめ4方向に、駒がぶつかるまで何マスでも進めます。縦横には進めません。",
  },
  KI: {
    type: "KI",
    kanji: "金",
    reading: "きんしょう",
    name: "金将",
    description: "前・横・後ろの6方向に1マス進めます。ななめ後ろの2方向にだけは進めません。",
  },
  GI: {
    type: "GI",
    kanji: "銀",
    reading: "ぎんしょう",
    name: "銀将",
    description: "前とななめ4方向（前ななめ2つ・後ろななめ2つ）の合計5方向に1マス進めます。真横・真後ろには進めません。",
  },
  KE: {
    type: "KE",
    kanji: "桂",
    reading: "けいま",
    name: "桂馬",
    description:
      "2マス前の、少し斜め左右にだけジャンプできる特殊な駒です。将棋で唯一、他の駒を飛び越えて進めます。",
  },
  KY: {
    type: "KY",
    kanji: "香",
    reading: "きょうしゃ",
    name: "香車",
    description: "前方1方向にだけ、駒がぶつかるまで何マスでも進めます。後ろやななめには進めません。",
  },
  FU: {
    type: "FU",
    kanji: "歩",
    reading: "ふひょう",
    name: "歩兵",
    description: "前に1マスだけ進めます。将棋で一番数が多く、一番弱い駒です。敵の駒を取ることも前方向だけです。",
  },
  TO: {
    type: "TO",
    kanji: "と",
    reading: "ときん",
    name: "と金",
    promotesFrom: "FU",
    description: "歩が成った姿です。金将（きんしょう）とまったく同じ、6方向に1マス動く強い駒になります。",
  },
  NY: {
    type: "NY",
    kanji: "杏",
    reading: "なりきょう",
    name: "成香",
    promotesFrom: "KY",
    description: "香車が成った姿です。金将と同じ、6方向に1マス動く駒になります。",
  },
  NK: {
    type: "NK",
    kanji: "圭",
    reading: "なりけい",
    name: "成桂",
    promotesFrom: "KE",
    description: "桂馬が成った姿です。金将と同じ、6方向に1マス動く駒になります。",
  },
  NG: {
    type: "NG",
    kanji: "全",
    reading: "なりぎん",
    name: "成銀",
    promotesFrom: "GI",
    description: "銀将が成った姿です。金将と同じ、6方向に1マス動く駒になります。",
  },
  UM: {
    type: "UM",
    kanji: "馬",
    reading: "うま（りゅうま）",
    name: "竜馬",
    promotesFrom: "KA",
    description: "角が成った姿です。角の動き（ななめに何マスでも）に加えて、縦横1マスにも動けるようになります。",
  },
  RY: {
    type: "RY",
    kanji: "龍",
    reading: "りゅう（りゅうおう）",
    name: "竜王",
    promotesFrom: "HI",
    description: "飛車が成った姿です。飛車の動き（縦横に何マスでも）に加えて、ななめ1マスにも動けるようになります。",
  },
};

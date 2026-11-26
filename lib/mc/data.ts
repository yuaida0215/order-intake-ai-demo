// ============================================================
// ＭＣシステムズ様向け 新基幹システム モック — マスタ・初期データ
//   出典: 「ＭＣシステムズ様_受注の読み取りAI_要望と要件_v2」
//   工場名・画面項目・計算式は先方資料のまま。得意先・品番・金額は架空。
// ============================================================

export const DEMO_TODAY = "2026-12-01";
export const DEMO_NOW_LABEL = "2026/12/01（火）";

// ---------- 拠点 ----------
export type FactoryId = "F01" | "F02" | "F03" | "F04" | "F05" | "F06" | "F07" | "F08";
export type Factory = { id: FactoryId; name: string; short: string; region: "名古屋" | "西日本" | "東日本"; code: string };

export const FACTORIES: Factory[] = [
  { id: "F01", name: "中川本社工場", short: "中川", region: "名古屋", code: "NK" },
  { id: "F02", name: "鳴海工場", short: "鳴海", region: "名古屋", code: "NR" },
  { id: "F03", name: "蟹江工場", short: "蟹江", region: "名古屋", code: "KN" },
  { id: "F04", name: "清船工場", short: "清船", region: "名古屋", code: "KF" },
  { id: "F05", name: "西日本第一工場", short: "西日本1", region: "西日本", code: "W1" },
  { id: "F06", name: "西日本第二工場", short: "西日本2", region: "西日本", code: "W2" },
  { id: "F07", name: "厚木工場", short: "厚木", region: "東日本", code: "AT" },
  { id: "F08", name: "太田工場", short: "太田", region: "東日本", code: "OT" },
];
export const factoryById = (id: FactoryId) => FACTORIES.find((f) => f.id === id)!;

// ---------- 法人 ----------
export const ENTITIES = [
  { id: "E1", name: "株式会社ＭＣシステムズ", short: "MC本体", note: "受託加工・薬液設備販売" },
  { id: "E2", name: "関係会社A（仮称）", short: "関係会社A", note: "同一オーナーの別法人・処理液の仕入先" },
] as const;

// ---------- 請求グループ（5グループ・中身は仮置き） ----------
export type BillingGroupId = "G1" | "G2" | "G3" | "G4" | "G5";
export const BILLING_GROUPS: { id: BillingGroupId; name: string; cutoff: string; pay: string; note: string }[] = [
  { id: "G1", name: "月末締め", cutoff: "毎月末日", pay: "翌月末 振込", note: "標準の得意先" },
  { id: "G2", name: "20日締め", cutoff: "毎月20日", pay: "翌月20日 振込", note: "" },
  { id: "G3", name: "15日締め", cutoff: "毎月15日", pay: "翌月15日 振込", note: "" },
  { id: "G4", name: "検収基準", cutoff: "客先検収の確定後", pay: "検収月の翌月末", note: "客先の買掛リストと突き合わせてから請求" },
  { id: "G5", name: "関係会社", cutoff: "毎月末日", pay: "2法人間で相殺", note: "関係会社Aとの取引" },
];

// ---------- 得意先（架空） ----------
export type CustomerId = "C001" | "C002" | "C003" | "C004" | "C005" | "C006" | "C007" | "C008" | "C009";
export type Customer = {
  id: CustomerId;
  name: string;
  short: string;
  kana: string;
  factories: FactoryId[];
  group: BillingGroupId;
  channel: "紙（部品同梱）" | "FAX" | "EDI";
  rounding: string;
};

export const CUSTOMERS: Customer[] = [
  { id: "C001", name: "東海精密工業株式会社", short: "東海精密", kana: "ﾄｳｶｲｾｲﾐﾂｺｳｷﾞｮｳ", factories: ["F03", "F01"], group: "G1", channel: "紙（部品同梱）", rounding: "完成数量は箱単位で数え、端数は端数箱として別記" },
  { id: "C002", name: "三河オートパーツ株式会社", short: "三河オート", kana: "ﾐｶﾜｵｰﾄﾊﾟｰﾂ", factories: ["F02"], group: "G2", channel: "FAX", rounding: "10個未満切り捨て" },
  { id: "C003", name: "尾張発條工業株式会社", short: "尾張発條", kana: "ｵﾜﾘﾊﾂｼﾞｮｳｺｳｷﾞｮｳ", factories: ["F04"], group: "G1", channel: "EDI", rounding: "kgは小数第1位で四捨五入" },
  { id: "C004", name: "知多プレス工業株式会社", short: "知多プレス", kana: "ﾁﾀﾌﾟﾚｽｺｳｷﾞｮｳ", factories: ["F03"], group: "G4", channel: "FAX", rounding: "注文数量どおり（過不足は検収で調整）" },
  { id: "C005", name: "豊橋ファスナー株式会社", short: "豊橋ファスナー", kana: "ﾄﾖﾊｼﾌｧｽﾅｰ", factories: ["F01"], group: "G3", channel: "紙（部品同梱）", rounding: "100個単位で切り捨て" },
  { id: "C006", name: "相模ダイカスト株式会社", short: "相模ダイカスト", kana: "ｻｶﾞﾐﾀﾞｲｶｽﾄ", factories: ["F07"], group: "G1", channel: "FAX", rounding: "kgは小数第1位で四捨五入" },
  { id: "C007", name: "両毛精機株式会社", short: "両毛精機", kana: "ﾘｮｳﾓｳｾｲｷ", factories: ["F08"], group: "G2", channel: "EDI", rounding: "注文数量どおり" },
  { id: "C008", name: "播磨鍛造株式会社", short: "播磨鍛造", kana: "ﾊﾘﾏﾀﾝｿﾞｳ", factories: ["F05"], group: "G1", channel: "紙（部品同梱）", rounding: "kgは小数第1位で切り捨て" },
  { id: "C009", name: "吉備機工株式会社", short: "吉備機工", kana: "ｷﾋﾞｷｺｳ", factories: ["F06"], group: "G3", channel: "FAX", rounding: "10個未満切り捨て" },
];
export const customerById = (id: CustomerId) => CUSTOMERS.find((c) => c.id === id)!;

// ---------- 処理液・設備 ----------
export const LIQUIDS = [
  { code: "ZF-100", name: "ZF-100 亜鉛フレーク下塗り", unitPrice: 2850, stockKg: 1840, reorderKg: 1200, supplier: "関係会社A（仮称）" },
  { code: "TC-20B", name: "TC-20B 上塗り（黒）", unitPrice: 3420, stockKg: 620, reorderKg: 800, supplier: "関係会社A（仮称）" },
  { code: "TC-30S", name: "TC-30S 上塗り（銀）", unitPrice: 3180, stockKg: 940, reorderKg: 600, supplier: "関係会社A（仮称）" },
  { code: "SL-05", name: "SL-05 シーラー", unitPrice: 2240, stockKg: 410, reorderKg: 300, supplier: "中部化工商事（架空）" },
  { code: "DG-7", name: "DG-7 アルカリ脱脂剤", unitPrice: 680, stockKg: 2600, reorderKg: 1500, supplier: "中部化工商事（架空）" },
];

// ---------- 品番マスタ ----------
export type ProcessStep = {
  step: string; // 工程
  kind: string; // 分類
  equipment: string; // 処理設備
  pattern: string; // パターン
  chargeKg: number; // 投入量
  rpm: number; // 転/回
  tilt: number; // 傾動回数
  bakeMin: number; // 焼時間
  scale: number; // 目盛
  preTemp: number; // 焼前温
  postTemp: number; // 焼後温
  liquid: string;
};

export type Item = {
  partNo: string; // 品番（一般名称）
  code: string; // 商品コード（6桁）
  name: string; // 商品名
  customerId: CustomerId;
  factoryId: FactoryId;
  group: string; // 品群
  liquid: string; // 処理液
  spec: string; // 仕様
  perBox: number; // 入数
  unitWeightG: number; // 単重(g)
  price: number; // 単価
  priceUnit: "個" | "kg";
  pre: { degrease: boolean; bake: boolean; shot: boolean };
  steps: ProcessStep[];
  outsource?: string; // 指定外注
  line: string; // 完成ライン
  lastOrder: string | null; // 前回受注日
  revisedAt?: string; // 処理条件の改訂日
  revisionNote?: string;
};

const ZF = (eq: string, pat: string, charge: number, bake = 20): ProcessStep => ({
  step: "下塗り",
  kind: "ディップスピン",
  equipment: eq,
  pattern: pat,
  chargeKg: charge,
  rpm: 300,
  tilt: 2,
  bakeMin: bake,
  scale: 6,
  preTemp: 80,
  postTemp: 320,
  liquid: "ZF-100",
});
const TC = (liq: string, eq: string, pat: string, charge: number, bake = 25): ProcessStep => ({
  step: "上塗り",
  kind: "ディップスピン",
  equipment: eq,
  pattern: pat,
  chargeKg: charge,
  rpm: 280,
  tilt: 3,
  bakeMin: bake,
  scale: 5,
  preTemp: 80,
  postTemp: 200,
  liquid: liq,
});

export const ITEMS: Item[] = [
  // ---- 東海精密（蟹江） ----
  {
    partNo: "90105-10A23", code: "310245", name: "フランジボルト M10×40", customerId: "C001", factoryId: "F03", group: "ボルト",
    liquid: "ZF-100 / TC-20B", spec: "下塗り2回＋上塗り黒 1回", perBox: 170, unitWeightG: 58.55, price: 7.2, priceUnit: "個",
    pre: { degrease: true, bake: true, shot: false }, line: "蟹江 第2ライン",
    steps: [ZF("DS-3号機", "P-12", 45), { ...ZF("DS-3号機", "P-12", 45), step: "下塗り（2回目）" }, TC("TC-20B", "DS-5号機", "P-08", 40)],
    lastOrder: "2026-11-24",
  },
  {
    partNo: "90179-08B11", code: "310311", name: "フランジナット M8", customerId: "C001", factoryId: "F03", group: "ナット",
    liquid: "ZF-100 / TC-20B", spec: "下塗り2回＋上塗り黒 1回", perBox: 600, unitWeightG: 12.4, price: 1.6, priceUnit: "個",
    pre: { degrease: true, bake: true, shot: false }, line: "蟹江 第2ライン",
    steps: [ZF("DS-3号機", "P-14", 50), { ...ZF("DS-3号機", "P-14", 50), step: "下塗り（2回目）" }, TC("TC-20B", "DS-5号機", "P-09", 45)],
    lastOrder: "2026-11-27",
  },
  {
    partNo: "52381-K0420", code: "310588", name: "ブラケット リヤ", customerId: "C001", factoryId: "F03", group: "プレス品",
    liquid: "ZF-100 / TC-30S", spec: "ショット後 下塗り1回＋上塗り銀", perBox: 40, unitWeightG: 186.2, price: 24.5, priceUnit: "個",
    pre: { degrease: true, bake: false, shot: true }, line: "蟹江 第1ライン", outsource: "北山ブラスト工業（架空）",
    steps: [ZF("DS-2号機", "P-03", 30, 25), TC("TC-30S", "DS-2号機", "P-04", 30)],
    lastOrder: "2026-09-12",
  },
  {
    partNo: "90119-12C07", code: "310402", name: "ボルト M12×55", customerId: "C001", factoryId: "F03", group: "ボルト",
    liquid: "ZF-100 / TC-20B", spec: "下塗り2回＋上塗り黒 1回", perBox: 90, unitWeightG: 112.8, price: 12.8, priceUnit: "個",
    pre: { degrease: true, bake: true, shot: false }, line: "蟹江 第2ライン",
    steps: [ZF("DS-3号機", "P-12", 45), { ...ZF("DS-3号機", "P-12", 45), step: "下塗り（2回目）" }, TC("TC-20B", "DS-5号機", "P-08", 40, 30)],
    lastOrder: "2026-11-25", revisedAt: "2026-11-27", revisionNote: "上塗りの焼時間 25分→30分（客先仕様書 Rev.C）",
  },
  // ---- 知多プレス（蟹江） ----
  {
    partNo: "16264-38010", code: "320118", name: "ホースクランプ A", customerId: "C004", factoryId: "F03", group: "クリップ",
    liquid: "ZF-100 / SL-05", spec: "下塗り1回＋シーラー", perBox: 500, unitWeightG: 9.8, price: 1.1, priceUnit: "個",
    pre: { degrease: true, bake: false, shot: false }, line: "蟹江 第3ライン",
    steps: [ZF("DS-4号機", "P-21", 55), { ...TC("SL-05", "DS-4号機", "P-22", 55, 15), step: "シーラー" }],
    lastOrder: "2026-11-26",
  },
  {
    partNo: "16264-38020", code: "320119", name: "ホースクランプ B", customerId: "C004", factoryId: "F03", group: "クリップ",
    liquid: "ZF-100 / SL-05", spec: "下塗り1回＋シーラー", perBox: 500, unitWeightG: 11.2, price: 1.2, priceUnit: "個",
    pre: { degrease: true, bake: false, shot: false }, line: "蟹江 第3ライン",
    steps: [ZF("DS-4号機", "P-21", 55), { ...TC("SL-05", "DS-4号機", "P-22", 55, 15), step: "シーラー" }],
    lastOrder: "2026-11-26",
  },
  // ---- 尾張発條（清船） ----
  {
    partNo: "48231-60A02", code: "330051", name: "コイルスプリング S", customerId: "C003", factoryId: "F04", group: "スプリング",
    liquid: "ZF-100 / TC-30S", spec: "下塗り2回＋上塗り銀", perBox: 200, unitWeightG: 34.0, price: 128, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: true }, line: "清船 第1ライン",
    steps: [ZF("DS-7号機", "P-31", 35), { ...ZF("DS-7号機", "P-31", 35), step: "下塗り（2回目）" }, TC("TC-30S", "DS-7号機", "P-32", 35)],
    lastOrder: "2026-11-28",
  },
  {
    partNo: "48231-60B05", code: "330052", name: "コイルスプリング M", customerId: "C003", factoryId: "F04", group: "スプリング",
    liquid: "ZF-100 / TC-30S", spec: "下塗り2回＋上塗り銀", perBox: 120, unitWeightG: 61.5, price: 124, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: true }, line: "清船 第1ライン",
    steps: [ZF("DS-7号機", "P-33", 35), { ...ZF("DS-7号機", "P-33", 35), step: "下塗り（2回目）" }, TC("TC-30S", "DS-7号機", "P-34", 35)],
    lastOrder: "2026-11-28",
  },
  // ---- 三河オート（鳴海） ----
  {
    partNo: "91552-06D30", code: "340210", name: "スプリングピン φ6", customerId: "C002", factoryId: "F02", group: "ピン",
    liquid: "ZF-100 / TC-20B", spec: "下塗り1回＋上塗り黒", perBox: 1000, unitWeightG: 4.2, price: 0.6, priceUnit: "個",
    pre: { degrease: true, bake: false, shot: false }, line: "鳴海 第1ライン",
    steps: [ZF("DS-1号機", "P-41", 60), TC("TC-20B", "DS-1号機", "P-42", 60)],
    lastOrder: "2026-11-27",
  },
  // ---- 豊橋ファスナー（中川） ----
  {
    partNo: "94050-08K00", code: "350077", name: "ワッシャー付ナット M8", customerId: "C005", factoryId: "F01", group: "ナット",
    liquid: "ZF-100 / TC-30S", spec: "下塗り2回＋上塗り銀", perBox: 800, unitWeightG: 9.1, price: 1.2, priceUnit: "個",
    pre: { degrease: true, bake: true, shot: false }, line: "中川 第4ライン",
    steps: [ZF("DS-8号機", "P-51", 50), { ...ZF("DS-8号機", "P-51", 50), step: "下塗り（2回目）" }, TC("TC-30S", "DS-9号機", "P-52", 45)],
    lastOrder: "2026-11-26",
  },
  // ---- 相模ダイカスト（厚木） ----
  {
    partNo: "11410-AT220", code: "360031", name: "ケースブラケット", customerId: "C006", factoryId: "F07", group: "ダイカスト品",
    liquid: "ZF-100 / TC-20B", spec: "下塗り1回＋上塗り黒", perBox: 24, unitWeightG: 412.0, price: 168, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: true }, line: "厚木 第1ライン",
    steps: [ZF("DS-11号機", "P-61", 25, 25), TC("TC-20B", "DS-11号機", "P-62", 25)],
    lastOrder: "2026-11-25",
  },
  // ---- 両毛精機（太田） ----
  {
    partNo: "23810-OT118", code: "370019", name: "スタッドボルト M10", customerId: "C007", factoryId: "F08", group: "ボルト",
    liquid: "ZF-100 / TC-30S", spec: "下塗り2回＋上塗り銀", perBox: 150, unitWeightG: 44.6, price: 5.9, priceUnit: "個",
    pre: { degrease: true, bake: true, shot: false }, line: "太田 第1ライン",
    steps: [ZF("DS-12号機", "P-71", 45), { ...ZF("DS-12号機", "P-71", 45), step: "下塗り（2回目）" }, TC("TC-30S", "DS-12号機", "P-72", 45)],
    lastOrder: "2026-11-30",
  },
  // ---- 播磨鍛造（西日本第一） ----
  {
    partNo: "34120-HM051", code: "380044", name: "ナックルアーム", customerId: "C008", factoryId: "F05", group: "鍛造品",
    liquid: "ZF-100 / TC-20B", spec: "ショット後 下塗り2回＋上塗り黒", perBox: 12, unitWeightG: 1240.0, price: 142, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: true }, line: "西日本1 第1ライン",
    steps: [ZF("DS-21号機", "P-81", 20, 30), { ...ZF("DS-21号機", "P-81", 20, 30), step: "下塗り（2回目）" }, TC("TC-20B", "DS-21号機", "P-82", 20)],
    lastOrder: "2026-11-29",
  },
  // ---- 吉備機工（西日本第二） ----
  {
    partNo: "56210-KB300", code: "390012", name: "Uボルト M8", customerId: "C009", factoryId: "F06", group: "ボルト",
    liquid: "ZF-100 / TC-30S", spec: "下塗り1回＋上塗り銀", perBox: 100, unitWeightG: 96.0, price: 9.4, priceUnit: "個",
    pre: { degrease: true, bake: false, shot: false }, line: "西日本2 第1ライン",
    steps: [ZF("DS-25号機", "P-91", 40), TC("TC-30S", "DS-25号機", "P-92", 40)],
    lastOrder: "2026-11-27",
  },
];
export const itemByPartNo = (p: string) => ITEMS.find((i) => i.partNo === p);

// ---------- 届いた注文書（AI読み取り待ち） ----------
export type DocRow = {
  partNo: string;
  name: string;
  perBox?: number;
  boxes: number;
  qty: number;
  lotNo: string;
  due: string;
  conf: number; // 読み取り信頼度
  note?: string; // AIが見つけた注意点
  handwritten?: boolean;
  mergedFrom?: number[]; // 括り合算された元の数量
};
export type IntakeDoc = {
  id: string;
  customerId: CustomerId;
  factoryId: FactoryId;
  kind: string;
  channel: "紙スキャン" | "FAX" | "EDI";
  receivedAt: string;
  slipNo: string; // 客先伝票No
  bin: string; // 便
  rows: DocRow[];
};

export const INTAKE_DOCS: IntakeDoc[] = [
  {
    id: "D-1201-01", customerId: "C001", factoryId: "F03", kind: "支給伝票", channel: "紙スキャン", receivedAt: "12/01 08:12",
    slipNo: "TS-261201-0457", bin: "1便",
    rows: [
      { partNo: "90105-10A23", name: "フランジボルト M10×40", perBox: 170, boxes: 23, qty: 3910, lotNo: "6L01A", due: "2026-12-04", conf: 0.94, handwritten: true, note: "箱数 24 を二重線で消して手書き 23。訂正後の 23 を採用" },
      { partNo: "90179-08B11", name: "フランジナット M8", perBox: 600, boxes: 8, qty: 4800, lotNo: "6L01B", due: "2026-12-04", conf: 0.98 },
      { partNo: "52381-K0420", name: "ブラケット リヤ", perBox: 40, boxes: 15, qty: 600, lotNo: "6L02A", due: "2026-12-05", conf: 0.97 },
      { partNo: "90119-12C07", name: "ボルト M12×55", perBox: 90, boxes: 20, qty: 1800, lotNo: "6L02B", due: "2026-12-05", conf: 0.96 },
      { partNo: "48655-T1180", name: "スタビリンクナット", perBox: 300, boxes: 6, qty: 1800, lotNo: "6L03A", due: "2026-12-08", conf: 0.95 },
    ],
  },
  {
    id: "D-1201-02", customerId: "C004", factoryId: "F03", kind: "支給部品出庫票", channel: "FAX", receivedAt: "12/01 08:40",
    slipNo: "CP-88213", bin: "2便",
    rows: [
      { partNo: "16264-38010", name: "ホースクランプ A", perBox: 500, boxes: 3, qty: 1220, lotNo: "K1130-07", due: "2026-12-03", conf: 0.88, handwritten: true, mergedFrom: [880, 340], note: "同じ品番の2行を手書きの括弧で括って「1220」。880＋340 と一致したので1ロットにまとめた" },
      { partNo: "16264-38020", name: "ホースクランプ B", perBox: 500, boxes: 4, qty: 2000, lotNo: "K1130-08", due: "2026-12-03", conf: 0.97 },
    ],
  },
  {
    id: "D-1201-03", customerId: "C003", factoryId: "F04", kind: "EDI 納入指示", channel: "EDI", receivedAt: "12/01 06:00",
    slipNo: "EDI-20261201-03", bin: "定期便",
    rows: [
      { partNo: "48231-60A02", name: "コイルスプリング S", perBox: 200, boxes: 12, qty: 2400, lotNo: "OH-4471", due: "2026-12-03", conf: 1 },
      { partNo: "48231-60B05", name: "コイルスプリング M", perBox: 120, boxes: 10, qty: 1200, lotNo: "OH-4472", due: "2026-12-03", conf: 1 },
    ],
  },
];

// ---------- ロット（受注〜入金までの1件） ----------
export type LotStatus =
  | "ticketed" // 作業票発行済み
  | "processing" // 処理中
  | "completed" // 完成（現品票・完了票）
  | "delivered" // 納品書発行・出荷
  | "sold" // 照合済み・売上計上
  | "billed" // 請求済み
  | "paid"; // 入金済み

export const LOT_FLOW: { key: LotStatus; label: string; short: string }[] = [
  { key: "ticketed", label: "受注・作業票発行", short: "作業票" },
  { key: "processing", label: "製造部で処理中", short: "処理中" },
  { key: "completed", label: "完成入力（現品票・完了票）", short: "完成" },
  { key: "delivered", label: "納品書発行・出荷", short: "納品" },
  { key: "sold", label: "照合OK・売上計上", short: "売上" },
  { key: "billed", label: "請求書発行", short: "請求" },
  { key: "paid", label: "入金消込", short: "入金" },
];

export type H3 = "初めて" | "久しぶり" | "変更";

export type LotEvent = { at: string; label: string; by: string };

export type Lot = {
  id: string; // 伝票番号
  ticketNo: string; // 作業票No
  factoryId: FactoryId;
  customerId: CustomerId;
  partNo: string;
  lotNo: string;
  boxes: number;
  qty: number;
  receivedAt: string; // 入荷日
  dueDate: string; // 納期
  source: "AI読取（紙）" | "AI読取（FAX）" | "EDI" | "手入力";
  docId?: string;
  h3?: H3;
  status: LotStatus;
  completedQty?: number;
  defectQty?: number;
  deliveryNo?: string;
  invoiceId?: string;
  matchNote?: string;
  events: LotEvent[];
};

// 既存ロット（いろいろな段階にあるもの）
type SeedRow = [string, FactoryId, CustomerId, string, number, LotStatus, string, string, number?];
//            伝票No  工場       得意先      品番    箱数    状態        入荷日       納期      不良数
const SEED: SeedRow[] = [
  ["KN-2611-3381", "F03", "C001", "90105-10A23", 24, "processing", "2026-11-30", "2026-12-03"],
  ["KN-2611-3382", "F03", "C001", "90179-08B11", 6, "processing", "2026-11-30", "2026-12-03"],
  ["KN-2611-3376", "F03", "C004", "16264-38010", 4, "completed", "2026-11-28", "2026-12-02"],
  ["KN-2611-3377", "F03", "C004", "16264-38020", 3, "completed", "2026-11-28", "2026-12-02"],
  ["KN-2611-3360", "F03", "C001", "90105-10A23", 24, "delivered", "2026-11-27", "2026-11-30"],
  ["KN-2611-3361", "F03", "C001", "90179-08B11", 8, "delivered", "2026-11-27", "2026-11-30"],
  ["KN-2611-3362", "F03", "C001", "90119-12C07", 20, "delivered", "2026-11-27", "2026-11-30", 18],
  ["KN-2611-3348", "F03", "C004", "16264-38010", 5, "delivered", "2026-11-26", "2026-11-29"],
  ["KN-2611-3330", "F03", "C001", "90105-10A23", 22, "sold", "2026-11-25", "2026-11-28"],
  ["KN-2611-3331", "F03", "C001", "90179-08B11", 7, "sold", "2026-11-25", "2026-11-28"],
  ["NK-2611-5120", "F01", "C005", "94050-08K00", 10, "processing", "2026-11-30", "2026-12-03"],
  ["NK-2611-5102", "F01", "C005", "94050-08K00", 12, "sold", "2026-11-26", "2026-11-29"],
  ["NR-2611-2210", "F02", "C002", "91552-06D30", 8, "completed", "2026-11-29", "2026-12-02"],
  ["NR-2611-2195", "F02", "C002", "91552-06D30", 10, "sold", "2026-11-27", "2026-11-30"],
  ["KF-2611-4402", "F04", "C003", "48231-60A02", 12, "delivered", "2026-11-28", "2026-12-01"],
  ["KF-2611-4403", "F04", "C003", "48231-60B05", 10, "sold", "2026-11-27", "2026-11-30"],
  ["AT-2611-1180", "F07", "C006", "11410-AT220", 30, "sold", "2026-11-26", "2026-11-29"],
  ["AT-2611-1188", "F07", "C006", "11410-AT220", 28, "processing", "2026-11-30", "2026-12-03"],
  ["OT-2611-0921", "F08", "C007", "23810-OT118", 20, "delivered", "2026-11-28", "2026-12-01"],
  ["W1-2611-0711", "F05", "C008", "34120-HM051", 40, "sold", "2026-11-27", "2026-11-30"],
  ["W1-2611-0716", "F05", "C008", "34120-HM051", 36, "ticketed", "2026-11-30", "2026-12-04"],
  ["W2-2611-0533", "F06", "C009", "56210-KB300", 15, "completed", "2026-11-29", "2026-12-02"],
];

const STATUS_INDEX: Record<LotStatus, number> = { ticketed: 0, processing: 1, completed: 2, delivered: 3, sold: 4, billed: 5, paid: 6 };

function seedEvents(status: LotStatus, received: string): LotEvent[] {
  const d = received.slice(5).replace("-", "/");
  const all: LotEvent[] = [
    { at: `${d} 08:30`, label: "AI読み取り→受入実行・作業票発行", by: "製造事務" },
    { at: `${d} 10:15`, label: "製造部で処理開始", by: "製造部" },
    { at: `${d} 16:40`, label: "完成入力（現品票・完了票を発行）", by: "製造事務" },
    { at: `${d} 17:10`, label: "納品書発行・出荷", by: "工場" },
    { at: `${d} 17:30`, label: "照合OK（注文書×完了票・納品書控×完了票）→売上計上", by: "システム" },
  ];
  return all.slice(0, STATUS_INDEX[status] + 1);
}

let ticketSeq = 0;
export function makeTicketNo(factoryId: FactoryId, dateIso: string): string {
  ticketSeq += 1;
  const f = factoryById(factoryId).code;
  return `${f}${dateIso.slice(2, 4)}${dateIso.slice(5, 7)}${dateIso.slice(8, 10)}-${String(ticketSeq).padStart(3, "0")}`;
}

export function initialLots(): Lot[] {
  ticketSeq = 0;
  return SEED.map(([id, f, c, p, boxes, status, received, due, defect]) => {
    const item = itemByPartNo(p)!;
    const qty = boxes * item.perBox;
    const done = STATUS_INDEX[status] >= 2;
    return {
      id,
      ticketNo: makeTicketNo(f, received),
      factoryId: f,
      customerId: c,
      partNo: p,
      lotNo: `${received.slice(6, 7)}${received.slice(8, 10)}${id.slice(-2)}`,
      boxes,
      qty,
      receivedAt: received,
      dueDate: due,
      source: customerById(c).channel === "EDI" ? "EDI" : customerById(c).channel === "FAX" ? "AI読取（FAX）" : "AI読取（紙）",
      status,
      completedQty: done ? qty - (defect ?? 0) : undefined,
      defectQty: done ? defect ?? 0 : undefined,
      deliveryNo: STATUS_INDEX[status] >= 3 ? `DN-${id.slice(-4)}` : undefined,
      events: seedEvents(status, received),
    } satisfies Lot;
  });
}

// ---------- 請求（11月度の締め前集計：架空の月次ベース値） ----------
// ロット1件ずつを全部持たせると重いので、月内の計上済み分はベース値として持つ。
export const MONTH_BASE: Record<CustomerId, { lots: number; amount: number }> = {
  C001: { lots: 1184, amount: 18_426_300 },
  C002: { lots: 642, amount: 6_208_400 },
  C003: { lots: 518, amount: 9_874_120 },
  C004: { lots: 806, amount: 4_112_760 },
  C005: { lots: 455, amount: 3_906_500 },
  C006: { lots: 288, amount: 7_742_880 },
  C007: { lots: 394, amount: 5_310_200 },
  C008: { lots: 236, amount: 8_996_640 },
  C009: { lots: 301, amount: 3_288_900 },
};

export type Invoice = {
  id: string;
  customerId: CustomerId;
  group: BillingGroupId;
  period: string;
  issuedAt: string;
  dueAt: string;
  lots: number;
  amount: number; // 税抜
  tax: number;
  status: "issued" | "paid" | "partial";
  paidAmount?: number;
  diffNote?: string;
};

export const INITIAL_INVOICES: Invoice[] = [
  { id: "INV-2610-0011", customerId: "C001", group: "G1", period: "10月度（10/1〜10/31）", issuedAt: "2026-11-02", dueAt: "2026-11-30", lots: 1210, amount: 17_980_200, tax: 1_798_020, status: "issued" },
  { id: "INV-2610-0014", customerId: "C003", group: "G1", period: "10月度（10/1〜10/31）", issuedAt: "2026-11-02", dueAt: "2026-11-30", lots: 502, amount: 9_512_400, tax: 951_240, status: "issued" },
  { id: "INV-2610-0016", customerId: "C006", group: "G1", period: "10月度（10/1〜10/31）", issuedAt: "2026-11-02", dueAt: "2026-11-30", lots: 270, amount: 7_206_000, tax: 720_600, status: "issued" },
  { id: "INV-2610-0018", customerId: "C008", group: "G1", period: "10月度（10/1〜10/31）", issuedAt: "2026-11-02", dueAt: "2026-11-30", lots: 228, amount: 8_640_000, tax: 864_000, status: "issued" },
  { id: "INV-2611-0203", customerId: "C002", group: "G2", period: "11月度（10/21〜11/20）", issuedAt: "2026-11-21", dueAt: "2026-12-20", lots: 628, amount: 6_011_800, tax: 601_180, status: "issued" },
  { id: "INV-2611-0204", customerId: "C007", group: "G2", period: "11月度（10/21〜11/20）", issuedAt: "2026-11-21", dueAt: "2026-12-20", lots: 380, amount: 5_120_600, tax: 512_060, status: "issued" },
  { id: "INV-2611-0151", customerId: "C005", group: "G3", period: "11月度（10/16〜11/15）", issuedAt: "2026-11-16", dueAt: "2026-12-15", lots: 441, amount: 3_802_300, tax: 380_230, status: "issued" },
];

// ---------- 銀行入金（11/30 着金） ----------
export type Deposit = {
  id: string;
  date: string;
  payerKana: string;
  amount: number;
  suggestion: { invoiceId: string; kind: "exact" | "fee" | "acceptance"; diff: number; reason: string };
};

export const INITIAL_DEPOSITS: Deposit[] = [
  { id: "BK-1130-01", date: "11/30", payerKana: "ﾄｳｶｲｾｲﾐﾂｺｳｷﾞｮｳ(ｶ", amount: 19_778_220, suggestion: { invoiceId: "INV-2610-0011", kind: "exact", diff: 0, reason: "名義と金額（税込）が完全一致" } },
  { id: "BK-1130-02", date: "11/30", payerKana: "ｵﾜﾘﾊﾂｼﾞｮｳｺｳｷﾞｮｳ(ｶ", amount: 10_462_980, suggestion: { invoiceId: "INV-2610-0014", kind: "fee", diff: -660, reason: "差額660円＝振込手数料の先方負担分。過去12回とも同額" } },
  { id: "BK-1130-03", date: "11/30", payerKana: "ｻｶﾞﾐﾀﾞｲｶｽﾄ(ｶ", amount: 7_926_600, suggestion: { invoiceId: "INV-2610-0016", kind: "exact", diff: 0, reason: "名義と金額（税込）が完全一致" } },
  { id: "BK-1130-04", date: "11/30", payerKana: "ﾊﾘﾏﾀﾝｿﾞｳ(ｶ", amount: 9_482_000, suggestion: { invoiceId: "INV-2610-0018", kind: "acceptance", diff: -22_000, reason: "差額22,000円。客先の買掛リストでは10/24納品分 ナックルアーム 不良返品 約141kg（税込22,000円）が減額されている" } },
];

// ---------- 外注加工 ----------
export const OUTSOURCE_ORDERS = [
  { id: "OS-2612-001", vendor: "北山ブラスト工業（架空）", process: "ショットブラスト（前処理）", factoryId: "F03" as FactoryId, partNo: "52381-K0420", qty: 600, sentAt: "12/01", returnAt: "12/02", status: "出荷待ち", cost: 9_000 },
  { id: "OS-2611-118", vendor: "北山ブラスト工業（架空）", process: "ショットブラスト（前処理）", factoryId: "F05" as FactoryId, partNo: "34120-HM051", qty: 432, sentAt: "11/29", returnAt: "12/01", status: "外注先で加工中", cost: 26_800 },
  { id: "OS-2611-112", vendor: "東三河熱処理（架空）", process: "ベーキング（水素脆性除去）", factoryId: "F04" as FactoryId, partNo: "48231-60A02", qty: 2400, sentAt: "11/27", returnAt: "11/28", status: "戻り済み・検品OK", cost: 14_400 },
  { id: "OS-2611-109", vendor: "相武メッキ（架空）", process: "部分マスキング", factoryId: "F07" as FactoryId, partNo: "11410-AT220", qty: 720, sentAt: "11/26", returnAt: "11/28", status: "戻り済み・請求書受領", cost: 21_600 },
];

// ---------- 薬液・処理設備の販売（在庫を持つ別の商流） ----------
export const GOODS = [
  { code: "S-ZF100-20", name: "ZF-100 亜鉛フレーク下塗り 20kg缶", unit: "缶", stock: 46, allocated: 12, reorder: 30, price: 64_000 },
  { code: "S-TC20B-20", name: "TC-20B 上塗り（黒）20kg缶", unit: "缶", stock: 18, allocated: 16, reorder: 20, price: 76_000 },
  { code: "S-DS-BSK", name: "ディップスピン用 バスケット Φ600", unit: "個", stock: 7, allocated: 2, reorder: 4, price: 148_000 },
  { code: "S-DS-MTR", name: "ディップスピン 回転モーターユニット", unit: "台", stock: 2, allocated: 1, reorder: 1, price: 680_000 },
  { code: "S-DS-SET", name: "小型ディップスピン処理装置 DS-mini", unit: "台", stock: 0, allocated: 0, reorder: 0, price: 12_800_000 },
];
export const GOODS_ORDERS = [
  { id: "SO-2612-004", customer: "九州コーティング（架空）", item: "S-TC20B-20", qty: 10, due: "12/05", status: "引当済・出荷待ち" },
  { id: "SO-2611-031", customer: "北陸防錆（架空）", item: "S-ZF100-20", qty: 12, due: "12/03", status: "出荷済・請求待ち" },
  { id: "SO-2611-027", customer: "信州表面処理（架空）", item: "S-DS-SET", qty: 1, due: "2027/02 下旬", status: "見積提出済" },
  { id: "SO-2611-022", customer: "北陸防錆（架空）", item: "S-DS-BSK", qty: 2, due: "12/10", status: "引当済・出荷待ち" },
];

// ---------- 経営ダッシュボード（11月実績・架空） ----------
export const FACTORY_MONTH: Record<FactoryId, { lots: number; sales: number; margin: number; onTime: number }> = {
  F01: { lots: 4120, sales: 31_400_000, margin: 0.36, onTime: 0.991 },
  F02: { lots: 3380, sales: 22_800_000, margin: 0.33, onTime: 0.986 },
  F03: { lots: 4410, sales: 34_900_000, margin: 0.38, onTime: 0.994 },
  F04: { lots: 2960, sales: 26_100_000, margin: 0.35, onTime: 0.989 },
  F05: { lots: 2240, sales: 21_700_000, margin: 0.31, onTime: 0.978 },
  F06: { lots: 1980, sales: 15_600_000, margin: 0.29, onTime: 0.981 },
  F07: { lots: 2150, sales: 19_800_000, margin: 0.34, onTime: 0.985 },
  F08: { lots: 2030, sales: 17_300_000, margin: 0.32, onTime: 0.990 },
};
export const MONTHLY_SALES = [
  { m: "6月", v: 176 }, { m: "7月", v: 181 }, { m: "8月", v: 158 }, { m: "9月", v: 184 }, { m: "10月", v: 192 }, { m: "11月", v: 190 },
];

// ---------- RFI 対応表 ----------
export const RFI_ITEMS: { area: string; req: string; now: string; how: string; href: string; fit: "○" | "△" }[] = [
  { area: "受託加工", req: "入荷登録", now: "注文書を見て基幹へ手入力。受注入力の画面が重い", how: "注文書をAIが読み、確認して「受入実行」するだけ。手で入れる時も4項目だけ", href: "/mc/intake", fit: "○" },
  { area: "受託加工", req: "作業票の発行", now: "受注入力のあと作業票を出す。客先注文書に作業票No.を手で転記", how: "受入実行と同時に作業票を発行。作業票No.はバーコードで紐づき、転記不要", href: "/mc/orders", fit: "○" },
  { area: "受託加工", req: "完成入力", now: "戻った作業票の手書き完成数量を見て、伝票番号を打って入力", how: "作業票のバーコードを読み、手書きの完成数量はAIが読み取り。取引先ごとの丸めも自動", href: "/mc/completion", fit: "○" },
  { area: "受託加工", req: "納品書発行・工場ごとの帳票", now: "工場で現品票・納品書を作る。納品書発行は基幹の外", how: "完成と同時に現品票・完了票、まとめて納品書。工場ごとの様式に切り替え", href: "/mc/shipping", fit: "○" },
  { area: "受託加工", req: "照合（注文書×完了票・納品書控×完了票）", now: "製造部・総務が紙で突き合わせ", how: "一致は自動で照合済み。差があるものだけ理由つきで一覧に出る", href: "/mc/matching", fit: "○" },
  { area: "販売", req: "請求グループ（5グループ）", now: "請求グループの集約が硬い", how: "締め日・支払条件ごとにグループを持ち、得意先の付け替えも画面で", href: "/mc/billing", fit: "○" },
  { area: "販売", req: "入金消込・検収差額", now: "得意先元帳と客先の買掛リストを手で突き合わせ、差額は書面で調整", how: "入金データを取り込みAIが消込候補と差額の理由を提示。差額調整書も下書き", href: "/mc/payments", fit: "○" },
  { area: "購買", req: "外注加工", now: "（記載なし）", how: "品番の指定外注から外注指示を自動作成。戻り・外注費を原価へ", href: "/mc/outsourcing", fit: "○" },
  { area: "購買", req: "材料仕入", now: "（記載なし）", how: "処理液の使用量を工程の投入量から計算し、発注点で発注案", href: "/mc/materials", fit: "○" },
  { area: "管理", req: "原価管理", now: "原価が案件に結びつかない", how: "ロットごとに材料費・加工費・外注費を積み上げ、品番・得意先・工場別の粗利", href: "/mc/cost", fit: "○" },
  { area: "販売", req: "薬液・処理設備の販売", now: "2つの商流を一元管理できない", how: "在庫を持つ別の商流として同じシステムの中で受注・引当・出荷・請求", href: "/mc/goods", fit: "○" },
  { area: "管理", req: "会計連携", now: "会計機能を使いこなせず仕訳が手作業", how: "売上・入金・外注・仕入から仕訳を自動作成し、会計ソフトへ連携", href: "/mc/accounting", fit: "○" },
  { area: "管理", req: "2法人管理", now: "別法人との突合・消込が手作業", how: "関係会社Aとの取引を両社の目線で自動突合・相殺", href: "/mc/intercompany", fit: "○" },
  { area: "基盤", req: "9拠点・拠点ごとの権限", now: "拠点間でリアルタイムに共有できない", how: "全拠点が1つのデータを見る。役割×拠点でメニューと見える範囲を制御", href: "/mc/settings", fit: "○" },
  { area: "基盤", req: "社内サーバー（オンプレミス）", now: "今の基幹も社内サーバー", how: "社内サーバーに置き、各拠点はVPN経由でブラウザから使う構成を想定（要相談）", href: "/mc/settings", fit: "○" },
  { area: "推奨", req: "BI", now: "CSVをExcelで手集計", how: "工場別の売上・粗利・納期遵守・3Hをその場で集計", href: "/mc/bi", fit: "○" },
  { area: "推奨", req: "REST API・EDI", now: "追加開発部分がAPIでつながらずCSVだけ", how: "EDI・顧客ポータル・設備の自動運転（FA）とAPIでつなぐ", href: "/mc/api", fit: "○" },
  { area: "移行", req: "商奉行・蔵奉行からのデータ移行", now: "受注の累計 1,502,981件", how: "マスタ・受注残・3H判定に要る受注履歴を移行（範囲は要相談）", href: "/mc/masters", fit: "△" },
];

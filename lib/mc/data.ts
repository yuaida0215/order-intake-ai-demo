// ============================================================
// ＭＣシステムズ様向け 新基幹システム モック — マスタ・初期データ
//   出典: RFI_基幹システム更新v4 Draft（2026/3）・業務フロー抜粋・二次商談（11/19）の画面共有
//         （受注入力 Ver3.0.0.0・受注一括取込発行・取込用Excel）・要望と要件v2・11/19提案資料
//   工場名・請求グループ・画面項目・計算式は先方資料のまま。得意先・品番・金額は架空。
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
  { id: "F05", name: "第1工場（西日本）", short: "第1", region: "西日本", code: "W1" },
  { id: "F06", name: "第2工場（西日本）", short: "第2", region: "西日本", code: "W2" },
  { id: "F07", name: "厚木工場", short: "厚木", region: "東日本", code: "AT" },
  { id: "F08", name: "太田工場", short: "太田", region: "東日本", code: "OT" },
];
export const factoryById = (id: FactoryId) => FACTORIES.find((f) => f.id === id)!;

// ---------- 法人 ----------
export const ENTITIES = [
  { id: "E1", name: "株式会社ＭＣシステムズ", short: "MC本体", note: "受託加工・薬液設備販売" },
  { id: "E2", name: "関係会社A（仮称）", short: "関係会社A", note: "同一オーナーの別法人・処理液の仕入先" },
] as const;

// ---------- 請求グループ（RFI 2-1：5グループに集約して請求書を発行） ----------
export type BillingGroupId = "G1" | "G2" | "G3" | "G4" | "G5";
export const BILLING_GROUPS: { id: BillingGroupId; name: string; issuer: string; note: string }[] = [
  { id: "G1", name: "名古屋グループ", issuer: "中川本社工場", note: "名古屋の4工場の売上を集約して1請求書" },
  { id: "G2", name: "西日本グループ", issuer: "第1工場", note: "西日本の2工場の売上を集約して1請求書" },
  { id: "G3", name: "東日本（厚木）", issuer: "厚木工場＋東京", note: "厚木工場（単独）" },
  { id: "G4", name: "東日本（太田）", issuer: "太田工場", note: "太田工場（単独）" },
  { id: "G5", name: "東日本（東京）", issuer: "東京事務所", note: "東京事務所（単独）" },
];
/** 工場→請求グループ（RFIの表のとおり。画面から付け替え可能） */
export const DEFAULT_FACTORY_GROUP: Record<FactoryId, BillingGroupId> = {
  F01: "G1", F02: "G1", F03: "G1", F04: "G1", F05: "G2", F06: "G2", F07: "G3", F08: "G4",
};

// ---------- 丸めの決まり（11/19提案資料の「想定」3つ。実際の決まりを伺って差し替え） ----------
export type RoundRule = "as_is" | "hundred" | "order_if_close";
export const ROUND_RULES: Record<RoundRule, string> = {
  as_is: "① 1個単位でそのまま",
  hundred: "② 百個単位に丸める",
  order_if_close: "③ 差が小さければ注文数で計上（±0.5%以内）",
};

// ---------- 得意先（架空） ----------
export type CustomerId = "C001" | "C002" | "C003" | "C004" | "C005" | "C006" | "C007" | "C008" | "C009";
export type Customer = {
  id: CustomerId;
  name: string;
  short: string;
  kana: string;
  code: string; // 得意先コード
  factories: FactoryId[];
  channel: "紙（部品同梱）" | "FAX" | "EDI";
  rule: RoundRule; // 完成数量の丸め
  weightRound: 1 | 0.1; // 売上重量の丸め単位(kg)
  rounding: string; // 表示用
};

export const CUSTOMERS: Customer[] = ([
  { id: "C001", name: "東海精密工業株式会社", short: "東海精密", kana: "ﾄｳｶｲｾｲﾐﾂｺｳｷﾞｮｳ", code: "070101", factories: ["F03", "F01"], channel: "紙（部品同梱）", rule: "order_if_close", weightRound: 1 },
  { id: "C002", name: "三河オートパーツ株式会社", short: "三河オート", kana: "ﾐｶﾜｵｰﾄﾊﾟｰﾂ", code: "070102", factories: ["F02"], channel: "FAX", rule: "hundred", weightRound: 0.1 },
  { id: "C003", name: "尾張発條工業株式会社", short: "尾張発條", kana: "ｵﾜﾘﾊﾂｼﾞｮｳｺｳｷﾞｮｳ", code: "070103", factories: ["F04"], channel: "EDI", rule: "as_is", weightRound: 0.1 },
  { id: "C004", name: "知多プレス工業株式会社", short: "知多プレス", kana: "ﾁﾀﾌﾟﾚｽｺｳｷﾞｮｳ", code: "070104", factories: ["F03"], channel: "FAX", rule: "order_if_close", weightRound: 1 },
  { id: "C005", name: "豊橋ファスナー株式会社", short: "豊橋ファスナー", kana: "ﾄﾖﾊｼﾌｧｽﾅｰ", code: "070105", factories: ["F01"], channel: "紙（部品同梱）", rule: "hundred", weightRound: 1 },
  { id: "C006", name: "相模ダイカスト株式会社", short: "相模ダイカスト", kana: "ｻｶﾞﾐﾀﾞｲｶｽﾄ", code: "070106", factories: ["F07"], channel: "FAX", rule: "as_is", weightRound: 0.1 },
  { id: "C007", name: "両毛精機株式会社", short: "両毛精機", kana: "ﾘｮｳﾓｳｾｲｷ", code: "070107", factories: ["F08"], channel: "EDI", rule: "as_is", weightRound: 1 },
  { id: "C008", name: "播磨鍛造株式会社", short: "播磨鍛造", kana: "ﾊﾘﾏﾀﾝｿﾞｳ", code: "070108", factories: ["F05"], channel: "紙（部品同梱）", rule: "as_is", weightRound: 0.1 },
  { id: "C009", name: "吉備機工株式会社", short: "吉備機工", kana: "ｷﾋﾞｷｺｳ", code: "070109", factories: ["F06"], channel: "FAX", rule: "hundred", weightRound: 0.1 },
] as Omit<Customer, "rounding">[]).map((c) => ({
  ...c,
  rounding: `${ROUND_RULES[c.rule]}／売上重量は${c.weightRound === 1 ? "1kg" : "0.1kg"}単位（想定）`,
}));
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
  spec: string; // 加工内容（取込用Excelの書き方）
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
    partNo: "90105-10A23", code: "310245", name: "フランジボルト M12×35", customerId: "C001", factoryId: "F03", group: "ボルト",
    liquid: "ZF-100 / TC-20B", spec: "防錆＋脱油", perBox: 170, unitWeightG: 58.55, price: 35.81, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: false }, line: "蟹江 第2ライン",
    steps: [ZF("371", "1", 45), { ...ZF("371", "1", 45), step: "下塗り（2回目）" }, TC("TC-20B", "373", "8", 40)],
    lastOrder: "2026-11-24",
  },
  {
    partNo: "90179-08B11", code: "310311", name: "フランジナット M8", customerId: "C001", factoryId: "F03", group: "ナット",
    liquid: "ZF-100 / TC-20B", spec: "防錆＋脱油", perBox: 600, unitWeightG: 12.4, price: 41.2, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: false }, line: "蟹江 第2ライン",
    steps: [ZF("371", "3", 50), { ...ZF("371", "3", 50), step: "下塗り（2回目）" }, TC("TC-20B", "373", "9", 45)],
    lastOrder: "2026-11-27",
  },
  {
    partNo: "52381-K0420", code: "310588", name: "ブラケット リヤ", customerId: "C001", factoryId: "F03", group: "プレス品",
    liquid: "ZF-100 / TC-30S", spec: "ショット＋防錆＋脱油", perBox: 40, unitWeightG: 186.2, price: 40.0, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: true }, line: "蟹江 第1ライン", outsource: "北山ブラスト工業（架空）",
    steps: [ZF("370", "3", 30, 25), TC("TC-30S", "370", "4", 30)],
    lastOrder: "2026-09-12",
  },
  {
    partNo: "90119-12C07", code: "310402", name: "ボルト M12×55", customerId: "C001", factoryId: "F03", group: "ボルト",
    liquid: "ZF-100 / TC-20B", spec: "防錆＋脱油", perBox: 90, unitWeightG: 112.8, price: 36.5, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: false }, line: "蟹江 第2ライン",
    steps: [ZF("371", "1", 45), { ...ZF("371", "1", 45), step: "下塗り（2回目）" }, TC("TC-20B", "373", "8", 40, 30)],
    lastOrder: "2026-11-25", revisedAt: "2026-11-27", revisionNote: "上塗りの焼時間 25分→30分（客先仕様書 Rev.C）",
  },
  // ---- 知多プレス（蟹江） ----
  {
    partNo: "16264-38010", code: "320118", name: "ホースクランプ A", customerId: "C004", factoryId: "F03", group: "クリップ",
    liquid: "ZF-100 / SL-05", spec: "防錆 混入梱包", perBox: 500, unitWeightG: 9.8, price: 52.0, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: false }, line: "蟹江 第3ライン",
    steps: [ZF("372", "10", 55), { ...TC("SL-05", "372", "10", 55, 15), step: "シーラー" }],
    lastOrder: "2026-11-26",
  },
  {
    partNo: "16264-38020", code: "320119", name: "ホースクランプ B", customerId: "C004", factoryId: "F03", group: "クリップ",
    liquid: "ZF-100 / SL-05", spec: "防錆 混入梱包", perBox: 500, unitWeightG: 11.2, price: 52.0, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: false }, line: "蟹江 第3ライン",
    steps: [ZF("372", "10", 55), { ...TC("SL-05", "372", "10", 55, 15), step: "シーラー" }],
    lastOrder: "2026-11-26",
  },
  // ---- 尾張発條（清船） ----
  {
    partNo: "48231-60A02", code: "330051", name: "コイルスプリング S", customerId: "C003", factoryId: "F04", group: "スプリング",
    liquid: "ZF-100 / TC-30S", spec: "酸洗＋防錆", perBox: 200, unitWeightG: 34.0, price: 48.0, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: true }, line: "清船 第1ライン",
    steps: [ZF("381", "9", 35), { ...ZF("381", "9", 35), step: "下塗り（2回目）" }, TC("TC-30S", "381", "10", 35)],
    lastOrder: "2026-11-28",
  },
  {
    partNo: "48231-60B05", code: "330052", name: "コイルスプリング M", customerId: "C003", factoryId: "F04", group: "スプリング",
    liquid: "ZF-100 / TC-30S", spec: "酸洗＋防錆", perBox: 120, unitWeightG: 61.5, price: 46.0, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: true }, line: "清船 第1ライン",
    steps: [ZF("381", "10", 35), { ...ZF("381", "10", 35), step: "下塗り（2回目）" }, TC("TC-30S", "381", "1", 35)],
    lastOrder: "2026-11-28",
  },
  // ---- 三河オート（鳴海） ----
  {
    partNo: "91552-06D30", code: "340210", name: "スプリングピン φ6", customerId: "C002", factoryId: "F02", group: "ピン",
    liquid: "ZF-100 / TC-20B", spec: "防錆 混入梱包", perBox: 1000, unitWeightG: 4.2, price: 68.0, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: false }, line: "鳴海 第1ライン",
    steps: [ZF("361", "8", 60), TC("TC-20B", "361", "9", 60)],
    lastOrder: "2026-11-27",
  },
  // ---- 豊橋ファスナー（中川） ----
  {
    partNo: "94050-08K00", code: "350077", name: "ワッシャー付ナット M8", customerId: "C005", factoryId: "F01", group: "ナット",
    liquid: "ZF-100 / TC-30S", spec: "防錆＋脱油", perBox: 800, unitWeightG: 9.1, price: 55.0, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: false }, line: "中川 第4ライン",
    steps: [ZF("382", "7", 50), { ...ZF("382", "7", 50), step: "下塗り（2回目）" }, TC("TC-30S", "383", "8", 45)],
    lastOrder: "2026-11-26",
  },
  // ---- 相模ダイカスト（厚木） ----
  {
    partNo: "11410-AT220", code: "360031", name: "ケースブラケット", customerId: "C006", factoryId: "F07", group: "ダイカスト品",
    liquid: "ZF-100 / TC-20B", spec: "ショット＋防錆", perBox: 24, unitWeightG: 412.0, price: 33.0, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: true }, line: "厚木 第1ライン",
    steps: [ZF("391", "6", 25, 25), TC("TC-20B", "391", "7", 25)],
    lastOrder: "2026-11-25",
  },
  // ---- 両毛精機（太田） ----
  {
    partNo: "23810-OT118", code: "370019", name: "スタッドボルト M10", customerId: "C007", factoryId: "F08", group: "ボルト",
    liquid: "ZF-100 / TC-30S", spec: "防錆＋脱油", perBox: 150, unitWeightG: 44.6, price: 38.0, priceUnit: "kg",
    pre: { degrease: true, bake: true, shot: false }, line: "太田 第1ライン",
    steps: [ZF("392", "5", 45), { ...ZF("392", "5", 45), step: "下塗り（2回目）" }, TC("TC-30S", "392", "6", 45)],
    lastOrder: "2026-11-30",
  },
  // ---- 播磨鍛造（第1工場・西日本） ----
  {
    partNo: "34120-HM051", code: "380044", name: "ナックルアーム", customerId: "C008", factoryId: "F05", group: "鍛造品",
    liquid: "ZF-100 / TC-20B", spec: "ショット＋防錆", perBox: 12, unitWeightG: 1240.0, price: 29.0, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: true }, line: "第1工場 第1ライン",
    steps: [ZF("401", "4", 20, 30), { ...ZF("401", "4", 20, 30), step: "下塗り（2回目）" }, TC("TC-20B", "401", "5", 20)],
    lastOrder: "2026-11-29",
  },
  // ---- 吉備機工（第2工場・西日本） ----
  {
    partNo: "56210-KB300", code: "390012", name: "Uボルト M8", customerId: "C009", factoryId: "F06", group: "ボルト",
    liquid: "ZF-100 / TC-30S", spec: "酸洗＋防錆", perBox: 100, unitWeightG: 96.0, price: 37.0, priceUnit: "kg",
    pre: { degrease: true, bake: false, shot: false }, line: "第2工場 第1ライン",
    steps: [ZF("402", "3", 40), TC("TC-30S", "402", "4", 40)],
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
      { partNo: "90105-10A23", name: "フランジボルト M10×40", perBox: 170, boxes: 23, qty: 3910, lotNo: "6L01A", due: "2026-12-04", conf: 0.78, handwritten: true, note: "箱数 24 を二重線で消して手書きで 23。推測で決めず、人が確かめる行にしました" },
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
      { partNo: "16264-38010", name: "ホースクランプ A", perBox: 500, boxes: 3, qty: 1220, lotNo: "K1130-07", due: "2026-12-03", conf: 0.72, handwritten: true, mergedFrom: [880, 340], note: "同じ品番の2行を手書きで括って「1220」（880＋340 と一致）。手書きなので人が確かめる行にしました" },
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
  inspection?: "合格" | "条件付き合格" | "不合格";
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
      inspection: done ? "合格" : undefined,
      defectQty: done ? defect ?? 0 : undefined,
      deliveryNo: STATUS_INDEX[status] >= 3 ? `DN-${id.slice(-4)}` : undefined,
      events: seedEvents(status, received),
    } satisfies Lot;
  });
}

// ---------- 請求（11月度の締め前集計：架空の月次ベース値） ----------
// ロット1件ずつを全部持たせると重いので、月内の計上済み分は得意先×工場のベース値として持つ。
export const MONTH_BASE: Record<CustomerId, Partial<Record<FactoryId, { lots: number; amount: number }>>> = {
  C001: { F03: { lots: 980, amount: 6_862_400 }, F01: { lots: 204, amount: 1_400_000 } },
  C002: { F02: { lots: 642, amount: 4_108_800 } },
  C003: { F04: { lots: 518, amount: 3_936_800 } },
  C004: { F03: { lots: 806, amount: 3_384_200 } },
  C005: { F01: { lots: 455, amount: 2_912_000 } },
  C006: { F07: { lots: 288, amount: 2_764_800 } },
  C007: { F08: { lots: 394, amount: 2_679_200 } },
  C008: { F05: { lots: 236, amount: 3_068_000 } },
  C009: { F06: { lots: 301, amount: 1_986_600 } },
};

export type InvoiceLine = { factoryId: FactoryId; lots: number; amount: number };
export type Invoice = {
  id: string;
  customerId: CustomerId;
  group: BillingGroupId;
  issuer: string; // 請求発行元
  period: string;
  issuedAt: string;
  dueAt: string;
  lots: number;
  amount: number; // 税抜
  tax: number;
  breakdown: InvoiceLine[]; // 工場ごとの内訳（集約請求）
  status: "issued" | "paid";
  paidAmount?: number;
  diffNote?: string;
};

const inv10 = (id: string, customerId: CustomerId, group: BillingGroupId, issuer: string, breakdown: InvoiceLine[], status: "issued" | "paid"): Invoice => {
  const amount = breakdown.reduce((s, b) => s + b.amount, 0);
  return {
    id, customerId, group, issuer, period: "10月度（10/1〜10/31）", issuedAt: "2026-11-02", dueAt: "2026-11-30",
    lots: breakdown.reduce((s, b) => s + b.lots, 0), amount, tax: Math.round(amount * 0.1), breakdown, status,
  };
};

export const INITIAL_INVOICES: Invoice[] = [
  inv10("INV-2610-0011", "C001", "G1", "中川本社工場", [{ factoryId: "F03", lots: 1002, amount: 6_996_800 }, { factoryId: "F01", lots: 208, amount: 1_450_000 }], "issued"),
  inv10("INV-2610-0012", "C002", "G1", "中川本社工場", [{ factoryId: "F02", lots: 630, amount: 4_032_000 }], "paid"),
  inv10("INV-2610-0013", "C004", "G1", "中川本社工場", [{ factoryId: "F03", lots: 790, amount: 3_318_000 }], "paid"),
  inv10("INV-2610-0014", "C003", "G1", "中川本社工場", [{ factoryId: "F04", lots: 502, amount: 3_815_200 }], "issued"),
  inv10("INV-2610-0015", "C005", "G1", "中川本社工場", [{ factoryId: "F01", lots: 448, amount: 2_867_200 }], "paid"),
  inv10("INV-2610-0016", "C006", "G3", "厚木工場＋東京", [{ factoryId: "F07", lots: 270, amount: 2_592_000 }], "issued"),
  inv10("INV-2610-0017", "C007", "G4", "太田工場", [{ factoryId: "F08", lots: 380, amount: 2_584_000 }], "paid"),
  inv10("INV-2610-0018", "C008", "G2", "第1工場", [{ factoryId: "F05", lots: 228, amount: 2_964_000 }], "issued"),
  inv10("INV-2610-0019", "C009", "G2", "第1工場", [{ factoryId: "F06", lots: 295, amount: 1_947_000 }], "paid"),
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
  { id: "BK-1130-01", date: "11/30", payerKana: "ﾄｳｶｲｾｲﾐﾂｺｳｷﾞｮｳ(ｶ", amount: 9_291_480, suggestion: { invoiceId: "INV-2610-0011", kind: "exact", diff: 0, reason: "名義と金額（税込）が完全一致。蟹江・中川の2工場分をまとめた請求" } },
  { id: "BK-1130-02", date: "11/30", payerKana: "ｵﾜﾘﾊﾂｼﾞｮｳｺｳｷﾞｮｳ(ｶ", amount: 4_196_060, suggestion: { invoiceId: "INV-2610-0014", kind: "fee", diff: -660, reason: "差額660円＝振込手数料の先方負担分。過去12回とも同額" } },
  { id: "BK-1130-03", date: "11/30", payerKana: "ｻｶﾞﾐﾀﾞｲｶｽﾄ(ｶ", amount: 2_851_200, suggestion: { invoiceId: "INV-2610-0016", kind: "exact", diff: 0, reason: "名義と金額（税込）が完全一致" } },
  { id: "BK-1130-04", date: "11/30", payerKana: "ﾊﾘﾏﾀﾝｿﾞｳ(ｶ", amount: 3_254_900, suggestion: { invoiceId: "INV-2610-0018", kind: "acceptance", diff: -5_500, reason: "差額5,500円。客先の買掛リストでは10/24納品分 ナックルアーム 不良返品139個（約172kg・税込5,500円）が減額されている" } },
];

// ---------- 外注加工 ----------
export const OUTSOURCE_ORDERS = [
  { id: "OS-2612-001", vendor: "北山ブラスト工業（架空）", process: "ショットブラスト（前処理）", factoryId: "F03" as FactoryId, partNo: "52381-K0420", qty: 600, sentAt: "12/01", returnAt: "12/02", status: "出荷待ち", cost: 2_800 },
  { id: "OS-2611-118", vendor: "北山ブラスト工業（架空）", process: "ショットブラスト（前処理）", factoryId: "F05" as FactoryId, partNo: "34120-HM051", qty: 432, sentAt: "11/29", returnAt: "12/01", status: "外注先で加工中", cost: 13_400 },
  { id: "OS-2611-112", vendor: "東三河熱処理（架空）", process: "ベーキング（水素脆性除去）", factoryId: "F04" as FactoryId, partNo: "48231-60A02", qty: 2400, sentAt: "11/27", returnAt: "11/28", status: "戻り済み・検品OK", cost: 1_200 },
  { id: "OS-2611-109", vendor: "相武メッキ（架空）", process: "部分マスキング", factoryId: "F07" as FactoryId, partNo: "11410-AT220", qty: 720, sentAt: "11/26", returnAt: "11/28", status: "戻り済み・請求書受領", cost: 8_900 },
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

// ---------- RFI 対応表（RFI 第4章の要件を原文の順に） ----------
export type RfiItem = {
  sec: "4-1 基本機能要件" | "4-2 導入・運用要件";
  pri: "必須" | "推奨" | "確認";
  req: string;
  text: string; // RFIの要件内容
  issue?: string; // RFI第3章の課題
  how: string;
  links: [string, string][];
  answer: "画面で確認" | "一部を画面で・残りは提案書" | "提案書で回答";
};

export const RFI_ITEMS: RfiItem[] = [
  { sec: "4-1 基本機能要件", pri: "必須", req: "受託加工管理", text: "各工場の直接受注に対応した入荷登録・完成入力・納品書発行。工場ごとの帳票フォーマット設定が可能なこと", issue: "注文書を見て基幹へ手入力（受注入力の画面が重い）", how: "注文書をAIが読み、人は迷った行だけ確かめて受入実行（入荷登録＋作業票発行）。完成入力は作業票のバーコード＋手書き数量の読み取り＋検査合否。納品書は工場ごとの様式", links: [["注文書の取込", "/mc/intake"], ["完成入力", "/mc/completion"], ["納品書", "/mc/shipping"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "請求グループ管理", text: "複数工場の売上を集約して1請求書として発行できること（名古屋→中川、西日本2工場→第1、厚木・太田は各単独）。グループ設定が柔軟に変更できること", issue: "請求グループの集約請求を現行システムで柔軟に対応できていない", how: "工場→請求グループの対応を持ち、締め処理で得意先ごとに複数工場の売上を1枚の請求書に（工場別の内訳つき）。工場の付け替えは画面から", links: [["売上・請求", "/mc/billing"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "外注加工管理", text: "複数外注先への加工委託の発注・入荷管理。受注案件への紐付けおよび外注費の原価計上ができること", issue: "現行は奉行で管理中", how: "品番の指定外注から外注指示を自動作成。戻り・外注費は作業票No.に紐づけて原価へ", links: [["外注加工", "/mc/outsourcing"], ["原価管理", "/mc/cost"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "材料仕入管理", text: "複数仕入先からの材料調達（発注・入荷・在庫管理）。加工原価への紐付けが可能なこと", how: "受注残の工程（処理液・投入量）から使用量を見込み、発注点で発注案。使用量はロットの材料費へ", links: [["材料仕入", "/mc/materials"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "原価管理", text: "受注案件別・工場別の原価（外注費・材料費・労務費等）を集計し、採算管理ができること", issue: "外注加工費・材料費が個別案件の原価に紐付けられておらず、案件別・工場別の採算把握が困難", how: "作業票No.（ロット）ごとに材料費・労務費・設備費・外注費を積み上げ、品番別・得意先別・工場別の粗利", links: [["原価管理", "/mc/cost"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "薬液・設備販売管理", text: "薬液・処理設備の仕入・販売を受託加工とは独立した商流として管理。受注・出荷・請求・在庫を一元管理できること", issue: "受託加工と薬液・設備販売が異なる商流のため、統合管理が難しい", how: "在庫を持つ別の商流として同じシステムの中で受注・引当・出荷・請求", links: [["薬液・設備の販売", "/mc/goods"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "会計連携", text: "販売・購買・在庫・原価データが会計モジュールへリアルタイム連携し、手作業仕訳を最小化できること", issue: "商奉行の会計機能を使いこなせておらず、月次決算・仕訳に手作業が多数", how: "売上計上・入金消込・外注・仕入の操作がそのまま仕訳になり、会計へ連携", links: [["会計連携", "/mc/accounting"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "複数法人管理", text: "2法人の取引データを同一システム上で管理し、会社間取引の消込・突合が標準機能で可能なこと", issue: "同一オーナー保有の別法人（仕入先）との受発注・請求の突合や消込に人手", how: "MC側の買掛と関係会社側の売掛を自動で突合し、差だけ人が確認。月末に相殺", links: [["2法人", "/mc/intercompany"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "必須", req: "マルチ拠点", text: "9拠点（工場8・事務所1）をVPN経由のオンプレミス環境で運用できること。拠点ごとの権限分離が可能なこと", issue: "VPN接続だが、リアルタイムでのデータ共有・可視化に制約", how: "全拠点が1つのデータを見る。役割×拠点でメニューと見える範囲を分ける（右上の利用者切替で確認）", links: [["拠点・権限", "/mc/settings"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "推奨", req: "データ分析・BI", text: "標準ダッシュボード機能またはBIツール連携APIを提供し、CSV手加工を廃止できること", issue: "条件指定でCSVを出力しExcelで加工・集計。リアルタイム性もない", how: "工場別の売上・粗利・納期遵守・3Hをその場で集計", links: [["経営ダッシュボード", "/mc/bi"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "推奨", req: "API連携", text: "REST APIを標準装備し、将来的なEDI・顧客ポータル・外部サービス連携に対応できること", issue: "アドオン部分がAPI連携に対応しておらず、CSV出力が主体。EDI・顧客ポータル連携が未実現", how: "受注・ロット・マスタ・仕訳をREST APIで。設備の自動運転（FA）とのマスタ同期も", links: [["API・EDI連携", "/mc/api"]], answer: "画面で確認" },
  { sec: "4-1 基本機能要件", pri: "確認", req: "同業種実績", text: "表面処理・メッキ・塗装等の受託加工業、または薬液・産業資材販売業への導入実績", how: "提案書でお答えします", links: [], answer: "提案書で回答" },
  { sec: "4-2 導入・運用要件", pri: "必須", req: "インフラ", text: "オンプレミスサーバー構成での導入が可能なこと（クラウド必須製品は選定対象外）。推奨サーバー仕様を提示のこと", how: "社内サーバーに置き、各拠点はVPN経由でブラウザから使う構成案を画面に。推奨サーバー仕様は提案書で", links: [["構成案", "/mc/settings"]], answer: "一部を画面で・残りは提案書" },
  { sec: "4-2 導入・運用要件", pri: "必須", req: "データ移行", text: "商奉行・蔵奉行からのマスタ・トランザクションデータの移行計画・実績を提示のこと", how: "移す対象（品番マスタ・受注残・受注履歴 1,502,981件）を画面に。移行計画は提案書で", links: [["品番マスタ", "/mc/masters"]], answer: "一部を画面で・残りは提案書" },
  { sec: "4-2 導入・運用要件", pri: "必須", req: "保守サポート", text: "導入後の障害対応・バージョンアップ対応（窓口・SLA・対応拠点）を明示のこと", how: "提案書でお答えします", links: [], answer: "提案書で回答" },
  { sec: "4-2 導入・運用要件", pri: "推奨", req: "導入スケジュール", text: "2029年3月末の本稼働を目標とし、実現可能なマスタースケジュール案を提示のこと", how: "提案書でお答えします（読み取りは基幹選びと切り離して先に始められる点も含めて）", links: [], answer: "提案書で回答" },
  { sec: "4-2 導入・運用要件", pri: "推奨", req: "教育・マニュアル", text: "工場スタッフ含む現場作業者向けの操作教育・日本語マニュアルを提供できること", how: "入力を4項目に絞り、迷った所だけ色が付く画面にして教えることを減らす。教育計画は提案書で", links: [["受注入力", "/mc/orders/new"]], answer: "一部を画面で・残りは提案書" },
  { sec: "4-2 導入・運用要件", pri: "確認", req: "保守体制", text: "名古屋近辺または西日本・東日本での常駐・訪問対応の可否", how: "提案書でお答えします", links: [], answer: "提案書で回答" },
];

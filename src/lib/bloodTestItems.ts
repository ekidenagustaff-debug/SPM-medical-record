export interface BloodTestItem {
  key: string;
  name: string;
  unit: string;
  refMale?: [number, number];
  refFemale?: [number, number];
  memo?: string;
}

export interface BloodTestCategory {
  label: string;
  items: BloodTestItem[];
}

export function getReferenceRange(item: BloodTestItem, gender?: string): [number, number] | null {
  if (gender === "女" && item.refFemale) return item.refFemale;
  if (item.refMale) return item.refMale;
  if (item.refFemale) return item.refFemale;
  return null;
}

export const BLOOD_TEST_CATEGORIES: BloodTestCategory[] = [
  {
    label: "貧血関連",
    items: [
      { key: "フェリチン(Ferritin)", name: "フェリチン", unit: "ng/mL", refMale: [20, 250], refFemale: [5, 100], memo: "貯蔵鉄。低下は鉄欠乏の早期指標" },
      { key: "Hb（ヘモグロビン量）", name: "Hb", unit: "g/dL", refMale: [13.7, 16.8], refFemale: [11.6, 14.8], memo: "ヘモグロビン量。酸素運搬能の指標" },
      { key: "ヘマトクリット値（Hematocrit）", name: "Hct", unit: "%", refMale: [40.7, 50.1], refFemale: [35.1, 44.4] },
      { key: "Fe（血清鉄）", name: "血清鉄", unit: "μg/dL", refMale: [54, 200], refFemale: [48, 154] },
      { key: "UIBC(不飽和鉄結合能)", name: "UIBC", unit: "μg/dL", refMale: [111, 324], refFemale: [111, 324] },
      { key: "TIBC(総鉄結合能)", name: "TIBC", unit: "μg/dL", refMale: [253, 394], refFemale: [253, 394] },
      { key: "TSAT(トランスフェリン飽和度)", name: "TSAT", unit: "%", refMale: [20, 50], refFemale: [20, 50], memo: "鉄の利用率。低値は鉄欠乏" },
      { key: "MCV（平均赤血球容積）", name: "MCV", unit: "fL", refMale: [83.6, 98.2], refFemale: [79.4, 98.8] },
      { key: "MCH（平均赤血球色素量）", name: "MCH", unit: "pg", refMale: [27.5, 33.2], refFemale: [26.3, 34.3] },
      { key: "MCHC（平均赤血球血色素濃度）", name: "MCHC", unit: "g/dL", refMale: [31.7, 35.3], refFemale: [30.7, 36.6] },
      { key: "網赤血球数", name: "網赤血球", unit: "‰", refMale: [2, 27], refFemale: [2, 27], memo: "赤血球産生の指標" },
    ],
  },
  {
    label: "疲労・炎症関連",
    items: [
      { key: "CK（クレアチンキナーゼ）", name: "CK", unit: "U/L", refMale: [59, 248], refFemale: [41, 153], memo: "筋肉疲労・損傷の指標" },
      { key: "BUN（尿素窒素）", name: "BUN", unit: "mg/dL", refMale: [8, 20], refFemale: [8, 20], memo: "タンパク代謝・脱水の指標" },
      { key: "コルチゾール(Cortisol)", name: "コルチゾール", unit: "μg/dL", refMale: [4.5, 21.1], refFemale: [4.5, 21.1], memo: "ストレスホルモン。慢性疲労では低下することも" },
      { key: "GOT/AST", name: "AST", unit: "U/L", refMale: [10, 40], refFemale: [10, 40], memo: "肝機能・筋肉損傷の指標" },
    ],
  },
  {
    label: "脱水・電解質関連",
    items: [
      { key: "Cr（クレアチニン）", name: "クレアチニン", unit: "mg/dL", refMale: [0.65, 1.07], refFemale: [0.46, 0.79], memo: "腎機能・筋肉量の指標" },
      { key: "K（カリウム）", name: "カリウム", unit: "mEq/L", refMale: [3.5, 5.0], refFemale: [3.5, 5.0] },
      { key: "Na（血清ナトリウム）", name: "ナトリウム", unit: "mEq/L", refMale: [135, 145], refFemale: [135, 145] },
      { key: "Cl（血清クロール）", name: "クロール", unit: "mEq/L", refMale: [98, 108], refFemale: [98, 108] },
      { key: "尿酸", name: "尿酸", unit: "mg/dL", refMale: [3.7, 7.0], refFemale: [2.5, 7.0], memo: "痛風・腎機能の指標" },
    ],
  },
  {
    label: "疲労骨折・骨代謝関連",
    items: [
      { key: "ALP（アルカリホスファターゼ）", name: "ALP", unit: "U/L", refMale: [38, 113], refFemale: [38, 113], memo: "骨代謝・肝機能の指標" },
      { key: "Ca(血清カルシウム)", name: "カルシウム", unit: "mg/dL", refMale: [8.8, 10.1], refFemale: [8.8, 10.1] },
    ],
  },
  {
    label: "その他",
    items: [
      { key: "LD（乳酸脱水素酵素）", name: "LDH", unit: "U/L", refMale: [124, 222], refFemale: [124, 222] },
      { key: "総蛋白", name: "総蛋白", unit: "g/dL", refMale: [6.6, 8.1], refFemale: [6.6, 8.1] },
      { key: "テストステロン", name: "テストステロン", unit: "ng/dL", refMale: [190, 740], refFemale: [10, 80], memo: "男性ホルモン。オーバートレーニングで低下" },
      { key: "亜鉛", name: "亜鉛", unit: "μg/dL", refMale: [80, 130], refFemale: [65, 110] },
      { key: "ビタミンD", name: "ビタミンD", unit: "ng/mL", refMale: [20, 60], refFemale: [20, 60], memo: "骨・免疫機能。不足しやすい" },
      { key: "白血球数", name: "白血球", unit: "×10³/μL", refMale: [3.3, 8.6], refFemale: [3.3, 8.6] },
      { key: "赤血球数", name: "赤血球", unit: "×10⁶/μL", refMale: [4.35, 5.55], refFemale: [3.86, 4.92] },
      { key: "血小板数", name: "血小板", unit: "×10³/μL", refMale: [158, 348], refFemale: [158, 348] },
      { key: "Neutro", name: "好中球", unit: "%", refMale: [40, 71], refFemale: [40, 71] },
      { key: "Baso", name: "好塩基球", unit: "%", refMale: [0, 1], refFemale: [0, 1] },
      { key: "Eosino", name: "好酸球", unit: "%", refMale: [0, 6], refFemale: [0, 6] },
      { key: "Lympho", name: "リンパ球", unit: "%", refMale: [16, 49], refFemale: [16, 49] },
      { key: "Mono", name: "単球", unit: "%", refMale: [2, 10], refFemale: [2, 10] },
    ],
  },
  {
    label: "女子選手ホルモン",
    items: [
      { key: "E2（エストラジオール）", name: "E2", unit: "pg/mL", refFemale: [19, 160], memo: "エストロゲン。低値は骨リスク増大" },
      { key: "FSH（卵胞刺激ホルモン）", name: "FSH", unit: "mIU/mL", refFemale: [3.0, 14.4] },
      { key: "LH（黄体形成ホルモン）", name: "LH", unit: "mIU/mL", refFemale: [1.8, 10.2] },
    ],
  },
];

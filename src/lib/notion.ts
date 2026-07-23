import { Client } from "@notionhq/client";
import { KarteRecord, KarteFormData, PlayerInfo, TeamInfo, RaceResult, MedicalKarteRecord, BloodTestRecord, PlayerProfile, PlayerProfileFormData } from "@/types/karte";
import {
  PageObjectResponse,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;
const MEMBERS_DATABASE_ID = process.env.NOTION_MEMBERS_DATABASE_ID!;
const RACE_RESULTS_DATABASE_ID = process.env.NOTION_RACE_RESULTS_DATABASE_ID ?? "35fbaada-911e-8099-926c-f466fa679254";
const MEDICAL_KARTE_DATABASE_ID = process.env.NOTION_MEDICAL_KARTE_DATABASE_ID ?? "63114b9380574b4485e0a8a455823f54";
const BLOOD_TEST_DATABASE_ID = process.env.NOTION_BLOOD_TEST_DATABASE_ID ?? "17232150351a454aaac1845412b83781";
const PLAYER_PROFILE_DATABASE_ID = process.env.NOTION_PLAYER_PROFILE_DATABASE_ID!;

const BLOOD_TEST_KEYS = [
  "フェリチン(Ferritin)",
  "Hb（ヘモグロビン量）",
  "ヘマトクリット値（Hematocrit）",
  "Fe（血清鉄）",
  "UIBC(不飽和鉄結合能)",
  "TIBC(総鉄結合能)",
  "TSAT(トランスフェリン飽和度)",
  "MCV（平均赤血球容積）",
  "MCH（平均赤血球色素量）",
  "MCHC（平均赤血球血色素濃度）",
  "網赤血球数",
  "CK（クレアチンキナーゼ）",
  "BUN（尿素窒素）",
  "コルチゾール(Cortisol)",
  "GOT/AST",
  "Cr（クレアチニン）",
  "K（カリウム）",
  "Na（血清ナトリウム）",
  "Cl（血清クロール）",
  "尿酸",
  "ALP（アルカリホスファターゼ）",
  "Ca(血清カルシウム)",
  "LD（乳酸脱水素酵素）",
  "総蛋白",
  "テストステロン",
  "亜鉛",
  "ビタミンD",
  "白血球数",
  "赤血球数",
  "血小板数",
  "Neutro",
  "Baso",
  "Eosino",
  "Lympho",
  "Mono",
  "E2（エストラジオール）",
  "FSH（卵胞刺激ホルモン）",
  "LH（黄体形成ホルモン）",
] as const;

function richText(value: string) {
  return [{ text: { content: value } }];
}

function extractText(prop: PageObjectResponse["properties"][string]): string {
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "select") return prop.select?.name ?? "";
  return "";
}

function extractTags(prop: PageObjectResponse["properties"][string]): string[] {
  if (prop.type === "multi_select") return prop.multi_select.map((t) => t.name);
  return [];
}

function extractFiles(prop: PageObjectResponse["properties"][string]): string[] {
  if (prop.type === "files") {
    return prop.files.flatMap((f) => {
      if (f.type === "external") return [f.external.url];
      if (f.type === "file") return [f.file.url];
      return [];
    });
  }
  return [];
}

function pageToKarte(page: PageObjectResponse): KarteRecord {
  const p = page.properties;
  const buinProp = p["部員"];
  const playerId =
    buinProp?.type === "relation" && buinProp.relation.length > 0
      ? buinProp.relation[0].id
      : undefined;
  const treatmentDateProp = p["施術日"];
  const treatmentDate =
    treatmentDateProp?.type === "date" && treatmentDateProp.date?.start
      ? treatmentDateProp.date.start.slice(0, 10)
      : "";
  const memo = extractText(p["memo"]) || extractText(p["総評"]);
  return {
    id: page.id,
    playerId,
    clientName: extractText(p["クライアント名"]),
    trainerName: extractText(p["担当トレーナー名"]),
    location: extractText(p["場所"]),
    chiefComplaint: extractText(p["主訴"]),
    physicalCheck: extractText(p["状態（フィジカルチェック）"]),
    procedureContent: extractText(p["実施内容"]),
    trainingContent: extractText(p["トレーニング内容"]),
    memo,
    tags: p["タグ"] ? extractTags(p["タグ"]) : [],
    mediaUrls: p["メディア"] ? extractFiles(p["メディア"]) : [],
    createdAt: treatmentDate ? `${treatmentDate}T00:00:00.000Z` : page.created_time,
  };
}

export async function getPlayers(): Promise<PlayerInfo[]> {
  const response = await notion.databases.query({
    database_id: MEMBERS_DATABASE_ID,
    filter: { property: "区分", select: { equals: "選手" } },
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      name: extractText(p["氏名"]),
      grade: p["学年"] ? extractText(p["学年"]) || undefined : undefined,
      gender: p["性別"] ? extractText(p["性別"]) || undefined : undefined,
    };
  });
}

export async function getPlayerById(playerId: string): Promise<PlayerInfo | null> {
  try {
    const page = (await notion.pages.retrieve({ page_id: playerId })) as PageObjectResponse;
    const p = page.properties;
    return {
      id: page.id,
      name: extractText(p["氏名"]),
      grade: p["学年"] ? extractText(p["学年"]) || undefined : undefined,
      gender: p["性別"] ? extractText(p["性別"]) || undefined : undefined,
    };
  } catch {
    return null;
  }
}

export async function createKarteRecord(data: KarteFormData): Promise<KarteRecord> {
  const response = (await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      "クライアント名": { title: richText(data.clientName) },
      "担当トレーナー名": { select: { name: data.trainerName } },
      ...(data.location ? { "場所": { select: { name: data.location } } } : {}),
      "主訴": { rich_text: richText(data.chiefComplaint) },
      "状態（フィジカルチェック）": { rich_text: richText(data.physicalCheck) },
      "実施内容": { rich_text: richText(data.procedureContent) },
      "トレーニング内容": { rich_text: richText(data.trainingContent) },
      "memo": { rich_text: richText(data.memo) },
      "タグ": { multi_select: data.tags.map((name) => ({ name })) },
      "メディア": {
        files: data.mediaUrls.map((url) => ({
          type: "external" as const,
          name: url.split("/").pop()?.split("?")[0] ?? "media",
          external: { url },
        })),
      },
      "部員": { relation: [{ id: data.playerId }] },
    },
  })) as PageObjectResponse;
  return pageToKarte(response);
}

export async function updateKarteRecord(id: string, data: KarteFormData): Promise<KarteRecord> {
  const response = (await notion.pages.update({
    page_id: id,
    properties: {
      "クライアント名": { title: richText(data.clientName) },
      "担当トレーナー名": { select: { name: data.trainerName } },
      "場所": data.location ? { select: { name: data.location } } : { select: null },
      "主訴": { rich_text: richText(data.chiefComplaint) },
      "状態（フィジカルチェック）": { rich_text: richText(data.physicalCheck) },
      "実施内容": { rich_text: richText(data.procedureContent) },
      "トレーニング内容": { rich_text: richText(data.trainingContent) },
      "memo": { rich_text: richText(data.memo) },
      "タグ": { multi_select: data.tags.map((name) => ({ name })) },
      "メディア": {
        files: data.mediaUrls.map((url) => ({
          type: "external" as const,
          name: url.split("/").pop()?.split("?")[0] ?? "media",
          external: { url },
        })),
      },
    },
  })) as PageObjectResponse;
  return pageToKarte(response);
}

export async function getKartesByPlayer(playerId: string): Promise<KarteRecord[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: "部員", relation: { contains: playerId } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  const records = (response.results as PageObjectResponse[]).map(pageToKarte);
  // 施術日を優先表示しているため、並び順もcreated_timeではなく表示日時(createdAt)基準に揃える
  // (過去データの一括移行では施術日と実際のNotionページ作成時刻が一致しないため)
  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRecentKartes(days = 6): Promise<KarteRecord[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { timestamp: "created_time", created_time: { on_or_after: since.toISOString() } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 50,
  });
  return (response.results as PageObjectResponse[]).map(pageToKarte);
}

export async function getTrainerOptions(): Promise<string[]> {
  const db = (await notion.databases.retrieve({ database_id: DATABASE_ID })) as DatabaseObjectResponse;
  const prop = db.properties["担当トレーナー名"];
  if (prop?.type === "select") return prop.select.options.map((o) => o.name);
  return [];
}

export async function getTagOptions(): Promise<string[]> {
  const db = (await notion.databases.retrieve({ database_id: DATABASE_ID })) as DatabaseObjectResponse;
  const prop = db.properties["タグ"];
  if (prop?.type === "multi_select") return prop.multi_select.options.map((o) => o.name);
  return [];
}

export async function getLocationOptions(): Promise<string[]> {
  const db = (await notion.databases.retrieve({ database_id: DATABASE_ID })) as DatabaseObjectResponse;
  const prop = db.properties["場所"];
  if (prop?.type === "select") return prop.select.options.map((o) => o.name);
  return [];
}

function pageToRaceResult(page: PageObjectResponse): RaceResult {
  const p = page.properties;
  const dateProp = p["日付"];
  const date = dateProp?.type === "date" && dateProp.date?.start ? dateProp.date.start.slice(0, 10) : "";
  const rankProp = p["順位"];
  const rank = rankProp?.type === "number" && rankProp.number != null ? rankProp.number : undefined;
  return {
    id: page.id,
    competitionName: extractText(p["大会名"]),
    eventName: extractText(p["種目（表示）"]),
    date,
    result: extractText(p["記録"]),
    rank,
    flags: p["フラグ"] ? extractTags(p["フラグ"]) : [],
    venue: extractText(p["会場"]),
    notes: extractText(p["備考"]),
    category: extractText(p["種別"]),
  };
}

export async function getRaceResultsByPlayer(playerId: string): Promise<RaceResult[]> {
  const response = await notion.databases.query({
    database_id: RACE_RESULTS_DATABASE_ID,
    filter: { property: "選手名", relation: { contains: playerId } },
    sorts: [{ property: "日付", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToRaceResult);
}

function pageToMedicalKarte(page: PageObjectResponse): MedicalKarteRecord {
  const p = page.properties;
  const buinProp = p["部員"];
  const playerId =
    buinProp?.type === "relation" && buinProp.relation.length > 0
      ? buinProp.relation[0].id
      : undefined;
  return {
    id: page.id,
    playerId,
    clientName: extractText(p["クライアント名"]),
    trainerName: extractText(p["担当トレーナー名"]),
    chiefComplaint: extractText(p["主訴"]),
    acupuncturePresent: extractText(p["針治療の有無"]),
    acupunctureLocation: extractText(p["針治療の箇所"]),
    treatmentScope: extractText(p["治療範囲"]),
    overallAssessment: extractText(p["総評"]),
    createdAt: page.created_time,
  };
}

export async function getMedicalKartesByPlayer(playerId: string): Promise<MedicalKarteRecord[]> {
  const response = await notion.databases.query({
    database_id: MEDICAL_KARTE_DATABASE_ID,
    filter: { property: "部員", relation: { contains: playerId } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToMedicalKarte);
}

export async function getRecentMedicalKartes(days = 6): Promise<MedicalKarteRecord[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const response = await notion.databases.query({
    database_id: MEDICAL_KARTE_DATABASE_ID,
    filter: { timestamp: "created_time", created_time: { on_or_after: since.toISOString() } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 50,
  });
  return (response.results as PageObjectResponse[]).map(pageToMedicalKarte);
}

function pageToBloodTest(page: PageObjectResponse): BloodTestRecord {
  const p = page.properties;
  const buinProp = p["部員"];
  const playerId =
    buinProp?.type === "relation" && buinProp.relation.length > 0
      ? buinProp.relation[0].id
      : undefined;
  const dateProp = p["採血日"];
  const testDate =
    dateProp?.type === "date" && dateProp.date?.start
      ? dateProp.date.start.slice(0, 10)
      : "";
  const values: Record<string, number | null> = {};
  for (const key of BLOOD_TEST_KEYS) {
    const prop = p[key];
    values[key] = prop?.type === "number" ? prop.number : null;
  }
  return {
    id: page.id,
    playerId,
    clientName: extractText(p["クライアント名"]),
    testDate,
    memo: p["メモ"] ? extractText(p["メモ"]) : "",
    values,
    createdAt: page.created_time,
  };
}

export async function getBloodTestsByPlayer(playerId: string): Promise<BloodTestRecord[]> {
  const response = await notion.databases.query({
    database_id: BLOOD_TEST_DATABASE_ID,
    filter: { property: "部員", relation: { contains: playerId } },
    sorts: [{ property: "採血日", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToBloodTest);
}

export async function getBloodTestDatesByPlayer(playerId: string): Promise<string[]> {
  const results = await getBloodTestsByPlayer(playerId);
  return results.map((r) => r.testDate).filter(Boolean);
}

function pageToProfile(page: PageObjectResponse): PlayerProfile {
  const p = page.properties;
  const buinProp = p["部員DB"];
  const playerId =
    buinProp?.type === "relation" && buinProp.relation.length > 0
      ? buinProp.relation[0].id
      : undefined;
  return {
    id: page.id,
    playerId,
    clientName: extractText(p["クライアント名"]),
    existingConditions: extractText(p["既往歴"]),
    medications: extractText(p["服用している薬"]),
    updatedAt: page.last_edited_time,
  };
}

export async function getPlayerProfileByPlayer(playerId: string): Promise<PlayerProfile | null> {
  const response = await notion.databases.query({
    database_id: PLAYER_PROFILE_DATABASE_ID,
    filter: { property: "部員DB", relation: { contains: playerId } },
    page_size: 1,
  });
  const page = (response.results as PageObjectResponse[])[0];
  return page ? pageToProfile(page) : null;
}

export async function upsertPlayerProfile(data: PlayerProfileFormData): Promise<PlayerProfile> {
  const existing = await getPlayerProfileByPlayer(data.playerId);
  const properties = {
    "クライアント名": { title: richText(data.clientName) },
    "既往歴": { rich_text: richText(data.existingConditions) },
    "服用している薬": { rich_text: richText(data.medications) },
    "部員DB": { relation: [{ id: data.playerId }] },
  };
  const response = existing
    ? ((await notion.pages.update({ page_id: existing.id, properties })) as PageObjectResponse)
    : ((await notion.pages.create({ parent: { database_id: PLAYER_PROFILE_DATABASE_ID }, properties })) as PageObjectResponse);
  return pageToProfile(response);
}

export async function getTeams(): Promise<TeamInfo[]> {
  const teamMap = new Map<string, Set<string>>();
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 100,
      start_cursor: cursor,
    });
    for (const page of response.results as PageObjectResponse[]) {
      const team = page.properties["チーム名"] ? extractText(page.properties["チーム名"]) : "";
      const player = extractText(page.properties["クライアント名"]);
      if (!team) continue;
      if (!teamMap.has(team)) teamMap.set(team, new Set());
      if (player) teamMap.get(team)!.add(player);
    }
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return Array.from(teamMap.entries())
    .map(([name, players]) => ({ name, playerCount: players.size }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

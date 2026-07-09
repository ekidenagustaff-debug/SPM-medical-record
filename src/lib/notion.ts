import { Client } from "@notionhq/client";
import { KarteRecord, KarteFormData, PlayerInfo, TeamInfo, RaceResult } from "@/types/karte";
import {
  PageObjectResponse,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;
const MEMBERS_DATABASE_ID = process.env.NOTION_MEMBERS_DATABASE_ID!;
const RACE_RESULTS_DATABASE_ID = process.env.NOTION_RACE_RESULTS_DATABASE_ID ?? "35fbaada-911e-8099-926c-f466fa679254";

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
  return {
    id: page.id,
    playerId,
    clientName: extractText(p["クライアント名"]),
    trainerName: extractText(p["担当トレーナー名"]),
    chiefComplaint: extractText(p["主訴"]),
    trainingContent: extractText(p["トレーニング内容"]),
    overallAssessment: extractText(p["総評"]),
    tags: p["タグ"] ? extractTags(p["タグ"]) : [],
    mediaUrls: p["メディア"] ? extractFiles(p["メディア"]) : [],
    createdAt: page.created_time,
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
      "主訴": { rich_text: richText(data.chiefComplaint) },
      "トレーニング内容": { rich_text: richText(data.trainingContent) },
      "総評": { rich_text: richText(data.overallAssessment) },
      "タグ": { multi_select: data.tags.map((name) => ({ name })) },
      "メディア": {
        files: data.mediaUrls.map((url) => ({
          type: "external" as const,
          name: url.split("/").pop()?.split("?")[0] ?? "media",
          external: { url },
        })),
      },
      "部員": {
        relation: [{ id: data.playerId }],
      },
    },
  })) as PageObjectResponse;
  return pageToKarte(response);
}

export async function getKartesByPlayer(playerId: string): Promise<KarteRecord[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "部員",
      relation: { contains: playerId },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToKarte);
}

export async function getRecentKartes(days = 6): Promise<KarteRecord[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      timestamp: "created_time",
      created_time: { on_or_after: since.toISOString() },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 50,
  });
  return (response.results as PageObjectResponse[]).map(pageToKarte);
}

export async function getTrainerOptions(): Promise<string[]> {
  const db = (await notion.databases.retrieve({
    database_id: DATABASE_ID,
  })) as DatabaseObjectResponse;
  const prop = db.properties["担当トレーナー名"];
  if (prop?.type === "select") {
    return prop.select.options.map((o) => o.name);
  }
  return [];
}

export async function getTagOptions(): Promise<string[]> {
  const db = (await notion.databases.retrieve({
    database_id: DATABASE_ID,
  })) as DatabaseObjectResponse;
  const prop = db.properties["タグ"];
  if (prop?.type === "multi_select") {
    return prop.multi_select.options.map((o) => o.name);
  }
  return [];
}

function pageToRaceResult(page: PageObjectResponse): RaceResult {
  const p = page.properties;
  const dateProp = p["日付"];
  const date =
    dateProp?.type === "date" && dateProp.date?.start
      ? dateProp.date.start.slice(0, 10)
      : "";
  const rankProp = p["順位"];
  const rank =
    rankProp?.type === "number" && rankProp.number != null
      ? rankProp.number
      : undefined;
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
    filter: {
      property: "選手名",
      relation: { contains: playerId },
    },
    sorts: [{ property: "日付", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToRaceResult);
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

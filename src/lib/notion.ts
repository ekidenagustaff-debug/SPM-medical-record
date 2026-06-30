import { Client } from "@notionhq/client";
import { KarteRecord, KarteFormData, TeamInfo, PlayerInfo } from "@/types/karte";
import {
  PageObjectResponse,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

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

function pageToKarte(page: PageObjectResponse): KarteRecord {
  const p = page.properties;
  return {
    id: page.id,
    teamName: p["チーム名"] ? extractText(p["チーム名"]) : "",
    clientName: extractText(p["クライアント名"]),
    trainerName: extractText(p["担当トレーナー名"]),
    chiefComplaint: extractText(p["主訴"]),
    trainingContent: extractText(p["トレーニング内容"]),
    overallAssessment: extractText(p["総評"]),
    tags: p["タグ"] ? extractTags(p["タグ"]) : [],
    createdAt: page.created_time,
  };
}

export async function createKarteRecord(data: KarteFormData): Promise<KarteRecord> {
  const response = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      クライアント名: { title: richText(data.clientName) },
      担当トレーナー名: { select: { name: data.trainerName } },
      主訴: { rich_text: richText(data.chiefComplaint) },
      トレーニング内容: { rich_text: richText(data.trainingContent) },
      総評: { rich_text: richText(data.overallAssessment) },
      チーム名: { select: { name: data.teamName } },
      タグ: { multi_select: data.tags.map((name) => ({ name })) },
    },
  }) as PageObjectResponse;
  return pageToKarte(response);
}

export async function getKartesByPlayer(
  teamName: string,
  playerName: string,
  limit = 100
): Promise<KarteRecord[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        { property: "チーム名", select: { equals: teamName } },
        { property: "クライアント名", title: { equals: playerName } },
      ],
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: limit,
  });
  return (response.results as PageObjectResponse[]).map(pageToKarte);
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
      const team = extractText(page.properties["チーム名"]);
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

export async function getPlayersByTeam(teamName: string): Promise<PlayerInfo[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: "チーム名", select: { equals: teamName } },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });

  const playerMap = new Map<string, { karteCount: number; lastKarte: string }>();
  for (const page of response.results as PageObjectResponse[]) {
    const player = extractText(page.properties["クライアント名"]);
    if (!player) continue;
    if (!playerMap.has(player)) {
      playerMap.set(player, { karteCount: 0, lastKarte: page.created_time });
    }
    playerMap.get(player)!.karteCount++;
  }

  return Array.from(playerMap.entries())
    .map(([name, { karteCount, lastKarte }]) => ({ name, karteCount, lastKarte }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
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

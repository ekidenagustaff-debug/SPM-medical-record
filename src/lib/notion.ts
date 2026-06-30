import { Client } from "@notionhq/client";
import { KarteRecord, KarteFormData } from "@/types/karte";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

function richText(value: string) {
  return [{ text: { content: value } }];
}

function extractRichText(prop: PageObjectResponse["properties"][string]): string {
  if (prop.type === "rich_text") {
    return prop.rich_text.map((t) => t.plain_text).join("");
  }
  if (prop.type === "title") {
    return prop.title.map((t) => t.plain_text).join("");
  }
  if (prop.type === "created_time") {
    return prop.created_time;
  }
  return "";
}

export async function createKarteRecord(data: KarteFormData): Promise<KarteRecord> {
  const response = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      クライアント名: { title: richText(data.clientName) },
      担当トレーナー名: { rich_text: richText(data.trainerName) },
      主訴: { rich_text: richText(data.chiefComplaint) },
      トレーニング内容: { rich_text: richText(data.trainingContent) },
      総評: { rich_text: richText(data.overallAssessment) },
    },
  }) as PageObjectResponse;

  return pageToKarte(response);
}

export async function getRecentKarteRecords(limit = 10): Promise<KarteRecord[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: limit,
  });

  return (response.results as PageObjectResponse[]).map(pageToKarte);
}

function pageToKarte(page: PageObjectResponse): KarteRecord {
  const p = page.properties;
  return {
    id: page.id,
    clientName: extractRichText(p["クライアント名"]),
    trainerName: extractRichText(p["担当トレーナー名"]),
    chiefComplaint: extractRichText(p["主訴"]),
    trainingContent: extractRichText(p["トレーニング内容"]),
    overallAssessment: extractRichText(p["総評"]),
    createdAt: page.created_time,
  };
}

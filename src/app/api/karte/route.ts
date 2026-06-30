import { NextRequest, NextResponse } from "next/server";
import { createKarteRecord, getKartesByPlayer } from "@/lib/notion";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const team = searchParams.get("team");
  const player = searchParams.get("player");

  if (!team || !player) {
    return NextResponse.json({ error: "team と player は必須です" }, { status: 400 });
  }

  try {
    const records = await getKartesByPlayer(team, player);
    return NextResponse.json(records);
  } catch (err) {
    console.error("Notion GET error:", err);
    return NextResponse.json({ error: "カルテの取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      teamName,
      clientName,
      trainerName,
      chiefComplaint,
      trainingContent,
      overallAssessment,
      tags,
    } = body;

    if (!teamName?.trim() || !clientName?.trim() || !trainerName?.trim()) {
      return NextResponse.json(
        { error: "チーム名・選手名・担当トレーナー名は必須です" },
        { status: 400 }
      );
    }

    const record = await createKarteRecord({
      teamName,
      clientName,
      trainerName,
      chiefComplaint: chiefComplaint ?? "",
      trainingContent: trainingContent ?? "",
      overallAssessment: overallAssessment ?? "",
      tags: Array.isArray(tags) ? tags : [],
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("Notion POST error:", err);
    return NextResponse.json({ error: "カルテの保存に失敗しました" }, { status: 500 });
  }
}

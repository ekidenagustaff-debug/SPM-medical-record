import { NextRequest, NextResponse } from "next/server";
import { createKarteRecord, getRecentKarteRecords } from "@/lib/notion";

export async function GET() {
  try {
    const records = await getRecentKarteRecords(10);
    return NextResponse.json(records);
  } catch (err) {
    console.error("Notion GET error:", err);
    return NextResponse.json({ error: "カルテの取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientName, trainerName, chiefComplaint, trainingContent, overallAssessment } = body;

    if (!clientName?.trim() || !trainerName?.trim()) {
      return NextResponse.json({ error: "クライアント名と担当トレーナー名は必須です" }, { status: 400 });
    }

    const record = await createKarteRecord({
      clientName,
      trainerName,
      chiefComplaint: chiefComplaint ?? "",
      trainingContent: trainingContent ?? "",
      overallAssessment: overallAssessment ?? "",
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("Notion POST error:", err);
    return NextResponse.json({ error: "カルテの保存に失敗しました" }, { status: 500 });
  }
}

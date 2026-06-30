import { NextRequest, NextResponse } from "next/server";
import { getPlayersByTeam } from "@/lib/notion";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamName: string }> }
) {
  try {
    const { teamName } = await params;
    const players = await getPlayersByTeam(decodeURIComponent(teamName));
    return NextResponse.json(players);
  } catch (err) {
    console.error("Players GET error:", err);
    return NextResponse.json({ error: "選手の取得に失敗しました" }, { status: 500 });
  }
}

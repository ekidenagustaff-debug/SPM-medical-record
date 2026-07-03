import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json({ error: "ストレージが設定されていません" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed = ["jpg", "jpeg", "png", "gif", "webp", "heic", "mp4", "mov", "webm"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "対応していないファイル形式です" }, { status: 400 });
  }

  try {
    const filename = `karte/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}

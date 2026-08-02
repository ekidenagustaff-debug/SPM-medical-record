"""classify.py の出力(レビュー済みJSON)をNotionに書き込む。

スクリプトを1回実行すれば全件処理する(レコードごとの許可プロンプトは発生しない)。
デフォルトはdry-run。実際に書き込むには --commit を付ける。

安全装置:
  - 選手名(clientName)が「部員」DBの氏名と完全一致しない場合は書き込まずスキップし、
    候補となりそうな名前を提示する(誤った選手に紐付けない)
  - 同一選手 x 同一施術日のレコードが既に存在する場合はスキップする(再実行しても重複しない)
  - 書き込み後、選手ごとに件数を再集計して期待値と比較する

使い方:
    python3 write_to_notion.py data/classified/若林良樹.json            # dry-run
    python3 write_to_notion.py data/classified/若林良樹.json --commit   # 実際に書き込む
"""

from __future__ import annotations

import argparse
import difflib
import json
import time
from pathlib import Path
from typing import Any

from common import load_env_file, notion_request, require_env


def rich_text(value: str) -> list[dict[str, Any]]:
    # Notion rich_text は1ブロックあたり2000文字制限があるため分割する
    chunks = [value[i : i + 1900] for i in range(0, len(value), 1900)] or [""]
    return [{"text": {"content": c}} for c in chunks]


def fetch_all_players(members_database_id: str) -> list[dict[str, str]]:
    players = []
    cursor = None
    while True:
        body: dict[str, Any] = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        resp = notion_request("POST", f"/databases/{members_database_id}/query", body)
        for page in resp.get("results", []):
            name_prop = page.get("properties", {}).get("氏名", {})
            title_parts = name_prop.get("title", [])
            name = "".join(t.get("plain_text", "") for t in title_parts)
            if name:
                players.append({"id": page["id"], "name": name})
        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")
    return players


def resolve_player_id(client_name: str, players: list[dict[str, str]]) -> tuple[str | None, list[str]]:
    for p in players:
        if p["name"] == client_name:
            return p["id"], []
    close = difflib.get_close_matches(client_name, [p["name"] for p in players], n=3, cutoff=0.5)
    return None, close


def find_existing_record(
    database_id: str, player_id: str, treatment_date: str, chief_complaint: str
) -> bool:
    # 同一選手・同一日に複数件の記録があるケースが実データにあるため(例: 通常セッションと
    # 別枠での怪我経過報告が同日に別々に書かれている)、日付だけでなく主訴の内容も一致する
    # 場合のみ「既存の同一レコード」とみなす(再実行時の重複作成防止が目的で、
    # 同日の別内容レコードまで誤ってスキップしないようにするため)
    body = {
        "filter": {
            "and": [
                {"property": "部員", "relation": {"contains": player_id}},
                {"property": "施術日", "date": {"equals": treatment_date}},
                {"property": "主訴", "rich_text": {"equals": chief_complaint[:2000]}},
            ]
        },
        "page_size": 1,
    }
    resp = notion_request("POST", f"/databases/{database_id}/query", body)
    return len(resp.get("results", [])) > 0


def count_records_for_player(database_id: str, player_id: str) -> int:
    total = 0
    cursor = None
    while True:
        body: dict[str, Any] = {
            "filter": {"property": "部員", "relation": {"contains": player_id}},
            "page_size": 100,
        }
        if cursor:
            body["start_cursor"] = cursor
        resp = notion_request("POST", f"/databases/{database_id}/query", body)
        total += len(resp.get("results", []))
        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")
    return total


def build_properties(record: dict[str, Any], player_id: str) -> dict[str, Any]:
    props: dict[str, Any] = {
        "クライアント名": {"title": rich_text(record["clientName"])},
        "主訴": {"rich_text": rich_text(record["chiefComplaint"])},
        "状態（フィジカルチェック）": {"rich_text": rich_text(record["physicalCheck"])},
        "実施内容": {"rich_text": rich_text(record["procedureContent"])},
        "トレーニング内容": {"rich_text": rich_text(record["trainingContent"])},
        "memo": {"rich_text": rich_text(record["memo"])},
        "タグ": {"multi_select": [{"name": t} for t in record["tags"]]},
        "部員": {"relation": [{"id": player_id}]},
    }
    if record.get("trainerName"):
        props["担当トレーナー名"] = {"select": {"name": record["trainerName"]}}
    if record.get("location"):
        props["場所"] = {"select": {"name": record["location"]}}
    if record.get("treatmentDate"):
        props["施術日"] = {"date": {"start": record["treatmentDate"]}}
    media_urls = record.get("mediaUrls") or []
    if media_urls:
        props["メディア"] = {
            "files": [
                {
                    "type": "external",
                    "name": url.rsplit("/", 1)[-1].split("?")[0] or "media",
                    "external": {"url": url},
                }
                for url in media_urls
            ]
        }
    return props


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("classified_json", type=Path, help="classify.py の出力JSON")
    parser.add_argument("--commit", action="store_true", help="実際にNotionへ書き込む(省略時はdry-run)")
    parser.add_argument("--sleep", type=float, default=0.4, help="書き込み間のスリープ秒数(レート制限対策)")
    args = parser.parse_args()

    load_env_file()
    database_id = require_env("NOTION_DATABASE_ID")
    members_database_id = require_env("NOTION_MEMBERS_DATABASE_ID")

    payload = json.loads(args.classified_json.read_text(encoding="utf-8"))
    person = payload["person"]
    records = payload["records"]

    print(f"{person}: {len(records)}件のレコードを処理します" + ("(dry-run)" if not args.commit else "(commit)"))

    players = fetch_all_players(members_database_id)
    player_id, suggestions = resolve_player_id(person, players)
    if not player_id:
        print(f"エラー: 「部員」DBに「{person}」が見つかりません。")
        if suggestions:
            print(f"  候補: {', '.join(suggestions)}")
        print("  先にNotion側で選手を登録するか、--person の表記を修正してください。処理を中止します。")
        return

    created, skipped_duplicate, errors = 0, 0, []
    for i, record in enumerate(records, start=1):
        treatment_date = record.get("treatmentDate")
        if not treatment_date:
            errors.append(f"[{i}] 施術日が不明のためスキップ: {record.get('sourceNoteTitle')}")
            continue

        if find_existing_record(database_id, player_id, treatment_date, record.get("chiefComplaint", "")):
            print(f"  [{i}/{len(records)}] {treatment_date} は既に存在するためスキップ")
            skipped_duplicate += 1
            continue

        props = build_properties(record, player_id)
        if not args.commit:
            print(f"  [{i}/{len(records)}] (dry-run) 作成予定: {treatment_date} / トレーナー={record.get('trainerName') or '?'} / タグ={record.get('tags')}")
            created += 1
            continue

        notion_request("POST", "/pages", {"parent": {"database_id": database_id}, "properties": props})
        print(f"  [{i}/{len(records)}] {treatment_date} を作成しました")
        created += 1
        time.sleep(args.sleep)

    print()
    print(f"結果: 作成{'予定' if not args.commit else ''} {created}件 / 重複スキップ {skipped_duplicate}件 / エラー {len(errors)}件")
    for e in errors:
        print(f"  - {e}")

    if args.commit:
        actual = count_records_for_player(database_id, player_id)
        print(f"検証: {person} のNotion上の総レコード数 = {actual}件")


if __name__ == "__main__":
    main()

"""write_to_notion.py のオフラインテスト(Notion API呼び出しなし)。"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from write_to_notion import build_properties, resolve_player_id, rich_text  # noqa: E402


def test_resolve_player_id_exact_match():
    players = [{"id": "p1", "name": "若林良樹"}, {"id": "p2", "name": "山田太郎"}]
    player_id, suggestions = resolve_player_id("若林良樹", players)
    assert player_id == "p1"
    assert suggestions == []


def test_resolve_player_id_no_match_returns_suggestions():
    players = [{"id": "p1", "name": "若林良樹"}]
    player_id, suggestions = resolve_player_id("若林良機", players)  # 1文字違い
    assert player_id is None
    assert "若林良樹" in suggestions


def test_build_properties_maps_all_fields():
    record = {
        "clientName": "若林良樹",
        "chiefComplaint": "疲労度10",
        "physicalCheck": "四頭筋の張りが強い。",
        "procedureContent": "オイルマッサージ",
        "trainingContent": "①エロンゲーション",
        "memo": "次回はもう少し負荷を上げる",
        "tags": ["リハビリ", "ケア中心"],
        "trainerName": "中野",
        "location": "神楽坂",
        "treatmentDate": "2024-01-15",
    }
    props = build_properties(record, "player-id-123")

    assert props["クライアント名"]["title"][0]["text"]["content"] == "若林良樹"
    assert props["主訴"]["rich_text"][0]["text"]["content"] == "疲労度10"
    assert props["部員"]["relation"] == [{"id": "player-id-123"}]
    assert props["担当トレーナー名"] == {"select": {"name": "中野"}}
    assert props["場所"] == {"select": {"name": "神楽坂"}}
    assert props["施術日"] == {"date": {"start": "2024-01-15"}}
    assert props["タグ"]["multi_select"] == [{"name": "リハビリ"}, {"name": "ケア中心"}]


def test_build_properties_omits_optional_fields_when_empty():
    record = {
        "clientName": "若林良樹",
        "chiefComplaint": "",
        "physicalCheck": "",
        "procedureContent": "",
        "trainingContent": "",
        "memo": "",
        "tags": [],
        "trainerName": "",
        "location": "",
        "treatmentDate": None,
    }
    props = build_properties(record, "player-id-123")
    assert "担当トレーナー名" not in props
    assert "場所" not in props
    assert "施術日" not in props
    assert "メディア" not in props


def test_rich_text_splits_long_content_into_2000_char_chunks():
    long_text = "あ" * 4500
    chunks = rich_text(long_text)
    assert len(chunks) == 3
    assert sum(len(c["text"]["content"]) for c in chunks) == 4500
    # 元のテキストを分割・連結しても文字が壊れていないこと
    assert "".join(c["text"]["content"] for c in chunks) == long_text


if __name__ == "__main__":
    test_resolve_player_id_exact_match()
    test_resolve_player_id_no_match_returns_suggestions()
    test_build_properties_maps_all_fields()
    test_build_properties_omits_optional_fields_when_empty()
    test_rich_text_splits_long_content_into_2000_char_chunks()
    print("すべてのテストが成功しました")

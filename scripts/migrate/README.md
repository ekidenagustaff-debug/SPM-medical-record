# Evernote → Notion カルテ移行パイプライン

数百人分のEvernoteカルテを、Claude Codeの利用枠（5時間/週制限）や
Notionページ作成のたびの許可プロンプトを消費せずにNotionへ移行するためのスクリプト群です。

## 全体の流れ

```
①Evernoteから.enexをエクスポート
        ↓
②parse_enex.py    — 本文を段落単位に分解 + 添付メディア抽出 (LLM不使用)
        ↓
③classify.py       — 段落を項目に分類 (Anthropic APIキーで実行。Claude Codeの利用枠は消費しない)
        ↓
④(人の目でJSONをレビュー)
        ↓
⑤write_to_notion.py — Notionへ一括書き込み (スクリプト実行の許可は1回だけ)
```

**設計上の最重要ポイント**: `classify.py` はLLMに「本文を書き写させません」。
段落ごとに番号を振り、モデルには「何番の段落がどの項目か」だけを答えさせ、
実際のテキストは元の段落をそのままスクリプト側で連結します。
これにより、以前の手動移行(若林良樹さん分)で発生した「LLMが書き写す際の文字化け」を
仕組みとして起こりえなくしています。

## 事前準備

### 1. Evernoteからエクスポート

Evernoteアプリで対象の人のノートブック（またはタグで絞り込んだノート群）を選択し、
「エクスポート」→「Evernote XML形式 (.enex)」で書き出してください。
1人1ファイルが基本ですが、複数ファイルでも `parse_enex.py` に並べて渡せます。

### 2. 依存パッケージ

```bash
cd scripts/migrate
pip3 install -r requirements.txt
```

### 3. 環境変数

このアプリの `.env.local`（`NOTION_TOKEN` / `NOTION_DATABASE_ID` / `NOTION_MEMBERS_DATABASE_ID`）を
そのまま読み込みます。追加で **Anthropic APIキー**が必要です:

```bash
# .env.local に追記するか、実行時にexport
export ANTHROPIC_API_KEY=sk-ant-...
```

> Anthropic APIキーは https://console.anthropic.com/ で発行できます。
> Claude Codeのサブスクリプション利用枠(5時間/週制限)とは別の従量課金なので、
> ここで大量に呼び出してもClaude Codeの制限には影響しません。
> デフォルトモデルは `claude-haiku-4-5-20251001`（低コスト）です。
> 分類精度に問題があれば `--model claude-sonnet-5` で精度を上げられます。

## 使い方

### ステップ1: パース

```bash
python3 parse_enex.py path/to/若林良樹.enex --person "若林良樹" --out-dir data/parsed
```

`data/parsed/若林良樹.json`（段落リスト）と `data/parsed/若林良樹_resources/`（添付ファイル実体）が出力されます。

### ステップ2: 分類

まずは少数件でテストすることを推奨します:

```bash
python3 classify.py data/parsed/若林良樹.json --limit 3
```

`data/classified/若林良樹.json` を開き、`trainerName` / `location` / `tags` が
正しい候補から選ばれているか、`chiefComplaint` などの項目分けが妥当かを確認してください。
問題なければ `--limit` を外して全件処理します:

```bash
python3 classify.py data/parsed/若林良樹.json
```

### ステップ3: レビュー

`data/classified/若林良樹.json` はただのJSONなので、エディタで直接開いて確認・修正できます。
各レコードには `rawParagraphs`（元の段落全部）も残しているので、
「この項目分けで合っているか」を元の文章と見比べながら確認できます。

修正が必要な場合はJSONを直接編集してください（このファイルがそのままステップ4の入力になります）。

### ステップ4: Notionへ書き込み

まずdry-run（実際には書き込まない）で内容を確認:

```bash
python3 write_to_notion.py data/classified/若林良樹.json
```

問題なければ `--commit` を付けて実行します。**許可プロンプトはこのコマンド実行時の1回だけです**:

```bash
python3 write_to_notion.py data/classified/若林良樹.json --commit
```

実行後、選手ごとの総レコード数が表示されるので、想定件数と一致するか確認してください。
同じコマンドを再実行しても、既に存在する（選手×施術日が一致する）レコードは
自動的にスキップされるため、重複作成の心配なく再実行できます。

## メディア（写真・動画）について

`write_to_notion.py` は現時点では **メディアファイルのアップロードは行いません**
(Notionの「メディア」プロパティは外部URLを参照する仕組みのため、
どこかにホスティングして公開URLを発行する必要があり、
アプリ側は Vercel Blob を使っていますがPythonから安全に検証できていないため見送りました)。

添付ファイルの実体は `data/parsed/<person>_resources/` に保存されているので、
必要な記録についてはアプリの「編集」画面から手動で添付してください。

## 複数人をまとめて処理する場合

人ごとにステップ1〜4を繰り返してください。各ステップとも1人1ファイル単位で完結するので、
シェルスクリプトで人数分ループさせることもできます:

```bash
for enex in exports/*.enex; do
  person=$(basename "$enex" .enex)
  python3 parse_enex.py "$enex" --person "$person"
  python3 classify.py "data/parsed/${person}.json"
  # ここで一旦レビューを挟むことを推奨
done
```

## トラブルシューティング

- **「部員」DBに選手が見つからない**: `write_to_notion.py` が候補となりそうな名前を
  提示します。Notion側の表記揺れ（旧字体・スペースの有無など）を確認してください。
- **レート制限 (429)**: `notion_request` / `anthropic_messages` はどちらも自動リトライします。
  頻発する場合は `write_to_notion.py --sleep` を増やしてください。
- **分類結果のJSONパースに失敗**: モデルが余計な説明文を含めて返した場合に発生します。
  再実行するか、`--model claude-sonnet-5` に切り替えてみてください。

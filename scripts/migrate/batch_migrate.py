"""数十人分のEvernote HTMLエクスポートを、フォルダに入れるだけで一括処理する。

想定するフォルダ構成(Evernoteの「HTML形式でエクスポート」をそのまま並べたもの):

    imports/
      中村海斗/
        中村海斗.html
        中村海斗 files/
      若林良樹/
        若林良樹.html
        若林良樹 files/
      ...

各人につき parse_html_export.py → write_to_notion.py を順に実行し、
最後に全員分の結果を一覧表示する。デフォルトはdry-run。

使い方:
    python3 batch_migrate.py imports/            # 全員dry-run
    python3 batch_migrate.py imports/ --commit   # 全員本番書き込み
    python3 batch_migrate.py imports/ --only 中村海斗   # 1人だけ処理(動作確認用)
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

from common import slugify_person_name

SCRIPT_DIR = Path(__file__).resolve().parent


@dataclass
class PersonResult:
    person: str
    ok: bool
    summary_lines: list[str] = field(default_factory=list)
    error: str | None = None


def find_person_dirs(import_dir: Path) -> list[tuple[str, Path]]:
    """<import_dir>/<氏名>/<氏名>.html というペアを探す。

    サブフォルダ名とhtmlファイル名が一致しない場合は、そのフォルダ内で
    唯一の.htmlファイルを使う(Evernoteのエクスポート時にノートブック名を
    変えていた場合などに対応するため)。
    """
    pairs = []
    for sub in sorted(import_dir.iterdir()):
        if not sub.is_dir():
            continue
        candidate = sub / f"{sub.name}.html"
        if candidate.exists():
            pairs.append((sub.name, candidate))
            continue
        htmls = list(sub.glob("*.html"))
        if len(htmls) == 1:
            pairs.append((htmls[0].stem, htmls[0]))
        elif len(htmls) == 0:
            print(f"警告: {sub} に.htmlファイルが見つかりません。スキップします")
        else:
            print(f"警告: {sub} に.htmlファイルが複数あり、どれを使うか判断できません。スキップします: {[h.name for h in htmls]}")
    return pairs


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=SCRIPT_DIR, capture_output=True, text=True)


def process_person(person: str, html_path: Path, classified_dir: Path, commit: bool) -> PersonResult:
    classified_path = classified_dir / f"{slugify_person_name(person)}.json"

    parse_proc = run(
        [sys.executable, "parse_html_export.py", str(html_path), "--person", person, "--out", str(classified_path)]
    )
    if parse_proc.returncode != 0:
        return PersonResult(person, ok=False, error=f"parse_html_export.py が失敗しました:\n{parse_proc.stderr}")

    write_cmd = [sys.executable, "write_to_notion.py", str(classified_path)]
    if commit:
        write_cmd.append("--commit")
    write_proc = run(write_cmd)
    if write_proc.returncode != 0:
        return PersonResult(person, ok=False, error=f"write_to_notion.py が失敗しました:\n{write_proc.stderr}")

    summary_lines = [
        line
        for line in write_proc.stdout.splitlines()
        if line.startswith("結果:") or line.startswith("検証:") or line.startswith("エラー:") or "見つかりません" in line
    ]
    ok = "見つかりません" not in write_proc.stdout
    return PersonResult(person, ok=ok, summary_lines=summary_lines or [write_proc.stdout.strip().splitlines()[-1]])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("import_dir", type=Path, help="人ごとのフォルダが並んだディレクトリ")
    parser.add_argument("--commit", action="store_true", help="実際にNotionへ書き込む(省略時は全員dry-run)")
    parser.add_argument("--only", help="指定した氏名(フォルダ名)の人だけ処理する(動作確認用)")
    parser.add_argument("--classified-dir", type=Path, default=Path("data/classified"), help="分類済みJSONの出力先")
    args = parser.parse_args()

    if not args.import_dir.exists():
        raise SystemExit(f"ディレクトリが見つかりません: {args.import_dir}")

    people = find_person_dirs(args.import_dir)
    if args.only:
        people = [(name, path) for name, path in people if name == args.only]
        if not people:
            raise SystemExit(f"--only で指定された「{args.only}」に一致するフォルダが見つかりません")

    if not people:
        raise SystemExit(f"{args.import_dir} の中に <氏名>/<氏名>.html の形式のフォルダが見つかりませんでした")

    print(f"{len(people)}人分を処理します" + ("(dry-run)" if not args.commit else "(commit)"))
    print()

    results: list[PersonResult] = []
    for i, (person, html_path) in enumerate(people, start=1):
        print(f"=== [{i}/{len(people)}] {person} ===")
        result = process_person(person, html_path, args.classified_dir, args.commit)
        results.append(result)
        if result.error:
            print(f"  ERROR: {result.error}")
        else:
            for line in result.summary_lines:
                print(f"  {line}")
        print()

    print("=" * 60)
    print("全体サマリー")
    print("=" * 60)
    ok_count = sum(1 for r in results if r.ok)
    for r in results:
        mark = "OK" if r.ok else "要確認"
        print(f"  [{mark}] {r.person}")
    print()
    print(f"{ok_count}/{len(results)}人が正常に処理されました" + ("(dry-run。--commitで本番書き込み)" if not args.commit else ""))


if __name__ == "__main__":
    main()

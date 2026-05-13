#!/usr/bin/env python3
"""Generate stable code-first indexes for this repository."""

from __future__ import annotations

import ast
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "indexes"

IGNORE_DIRS = {
    ".git",
    ".cursor",
    ".venv",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
}

CODE_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".sql",
    ".json",
}

LANGUAGE_BY_EXT = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript React",
    ".js": "JavaScript",
    ".jsx": "JavaScript React",
    ".py": "Python",
    ".sql": "SQL",
    ".json": "JSON",
}

DOC_TAG_RE = re.compile(r"@(?P<tag>[A-Za-z][A-Za-z0-9_-]*)(?:\s+(?P<value>.*))?$")

TS_JS_PATTERNS = [
    ("function", re.compile(r"^\s*(?:export\s+)?(?:async\s+)?function\s+(?P<name>[A-Za-z_$][\w$]*)\s*\(")),
    ("class", re.compile(r"^\s*(?:export\s+)?(?:default\s+)?class\s+(?P<name>[A-Za-z_$][\w$]*)\b")),
    ("interface", re.compile(r"^\s*(?:export\s+)?interface\s+(?P<name>[A-Za-z_$][\w$]*)\b")),
    ("type", re.compile(r"^\s*(?:export\s+)?type\s+(?P<name>[A-Za-z_$][\w$]*)\b")),
    ("constant", re.compile(r"^\s*(?:export\s+)?(?:const|let|var)\s+(?P<name>[A-Za-z_$][\w$]*)\s*=")),
]

SQL_PATTERNS = [
    ("table", re.compile(r"^\s*CREATE\s+(?:TEMP\s+|TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?P<name>[\w.\"\[\]]+)", re.IGNORECASE)),
    ("view", re.compile(r"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?P<name>[\w.\"\[\]]+)", re.IGNORECASE)),
    ("function", re.compile(r"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?P<name>[\w.\"\[\]]+)", re.IGNORECASE)),
]


@dataclass(frozen=True)
class Symbol:
    name: str
    kind: str
    path: str
    line: int
    tags: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class FileIndex:
    path: str
    language: str
    symbols: tuple[Symbol, ...]
    tags: dict[str, str] = field(default_factory=dict)


def relative_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def iter_code_files() -> Iterable[Path]:
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix not in CODE_EXTENSIONS:
            continue

        relative_parts = path.relative_to(ROOT).parts
        if any(part in IGNORE_DIRS for part in relative_parts):
            continue

        yield path


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8-sig", errors="replace")


def clean_comment_line(line: str) -> str:
    line = line.strip()
    prefixes = ("//", "#", "--", "/*", "*/", "*")

    changed = True
    while changed:
        changed = False
        for prefix in prefixes:
            if line.startswith(prefix):
                line = line[len(prefix) :].strip()
                changed = True

    return line


def parse_doc_tags(lines: Iterable[str]) -> dict[str, str]:
    tags: dict[str, str] = {}

    for raw_line in lines:
        line = clean_comment_line(raw_line)
        match = DOC_TAG_RE.match(line)
        if not match:
            continue

        tag = match.group("tag")
        value = (match.group("value") or "true").strip()
        tags[tag] = value

    return tags


def file_doc_tags(lines: list[str]) -> dict[str, str]:
    first_comments: list[str] = []

    for line in lines[:80]:
        stripped = line.strip()
        if not stripped:
            if first_comments:
                break
            continue
        if is_comment_line(stripped):
            first_comments.append(line)
            continue
        break

    return parse_doc_tags(first_comments)


def is_comment_line(stripped: str) -> bool:
    return stripped.startswith(("//", "#", "--", "/*", "*"))


def nearby_doc_tags(lines: list[str], line_number: int) -> dict[str, str]:
    start = max(0, line_number - 10)
    before_symbol = lines[start : line_number - 1]

    comment_block: list[str] = []
    for line in reversed(before_symbol):
        stripped = line.strip()
        if not stripped:
            if comment_block:
                break
            continue
        if is_comment_line(stripped):
            comment_block.append(line)
            continue
        break

    return parse_doc_tags(reversed(comment_block))


def extract_ts_js_symbols(path: Path, lines: list[str]) -> list[Symbol]:
    symbols: list[Symbol] = []
    rel_path = relative_path(path)

    for index, line in enumerate(lines, start=1):
        for kind, pattern in TS_JS_PATTERNS:
            match = pattern.match(line)
            if not match:
                continue
            symbols.append(
                Symbol(
                    name=match.group("name"),
                    kind=kind,
                    path=rel_path,
                    line=index,
                    tags=nearby_doc_tags(lines, index),
                )
            )
            break

    return symbols


def extract_python_symbols(path: Path, text: str, lines: list[str]) -> list[Symbol]:
    rel_path = relative_path(path)
    symbols: list[Symbol] = []

    try:
        tree = ast.parse(text)
    except SyntaxError:
        return extract_python_symbols_with_regex(path, lines)

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            kind = "function"
        elif isinstance(node, ast.ClassDef):
            kind = "class"
        else:
            continue

        symbols.append(
            Symbol(
                name=node.name,
                kind=kind,
                path=rel_path,
                line=node.lineno,
                tags=nearby_doc_tags(lines, node.lineno),
            )
        )

    return sorted(symbols, key=lambda item: (item.line, item.name))


def extract_python_symbols_with_regex(path: Path, lines: list[str]) -> list[Symbol]:
    rel_path = relative_path(path)
    symbols: list[Symbol] = []
    pattern = re.compile(r"^\s*(?P<kind>class|def|async\s+def)\s+(?P<name>[A-Za-z_]\w*)")

    for index, line in enumerate(lines, start=1):
        match = pattern.match(line)
        if not match:
            continue
        raw_kind = match.group("kind")
        kind = "class" if raw_kind == "class" else "function"
        symbols.append(
            Symbol(
                name=match.group("name"),
                kind=kind,
                path=rel_path,
                line=index,
                tags=nearby_doc_tags(lines, index),
            )
        )

    return symbols


def extract_sql_symbols(path: Path, lines: list[str]) -> list[Symbol]:
    rel_path = relative_path(path)
    symbols: list[Symbol] = []

    for index, line in enumerate(lines, start=1):
        for kind, pattern in SQL_PATTERNS:
            match = pattern.match(line)
            if not match:
                continue
            symbols.append(
                Symbol(
                    name=match.group("name").strip('"[]'),
                    kind=kind,
                    path=rel_path,
                    line=index,
                    tags=nearby_doc_tags(lines, index),
                )
            )
            break

    return symbols


def extract_json_symbols(path: Path, text: str) -> list[Symbol]:
    rel_path = relative_path(path)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []

    if not isinstance(data, dict):
        return []

    return [
        Symbol(name=str(key), kind="json-key", path=rel_path, line=1)
        for key in sorted(data.keys(), key=str)
    ]


def extract_symbols(path: Path, text: str, lines: list[str]) -> list[Symbol]:
    if path.suffix in {".ts", ".tsx", ".js", ".jsx"}:
        return extract_ts_js_symbols(path, lines)
    if path.suffix == ".py":
        return extract_python_symbols(path, text, lines)
    if path.suffix == ".sql":
        return extract_sql_symbols(path, lines)
    if path.suffix == ".json":
        return extract_json_symbols(path, text)
    return []


def build_indexes() -> list[FileIndex]:
    indexes: list[FileIndex] = []

    for path in iter_code_files():
        text = read_text(path)
        lines = text.splitlines()
        symbols = tuple(extract_symbols(path, text, lines))
        indexes.append(
            FileIndex(
                path=relative_path(path),
                language=LANGUAGE_BY_EXT.get(path.suffix, path.suffix.lstrip(".")),
                symbols=symbols,
                tags=file_doc_tags(lines),
            )
        )

    return sorted(indexes, key=lambda item: item.path)


def tag_summary(tags: dict[str, str]) -> str:
    if not tags:
        return ""
    return "; ".join(f"@{key} {value}" for key, value in sorted(tags.items()))


def render_files(indexes: list[FileIndex]) -> str:
    lines = [
        "# Files Index",
        "",
        "Generated by `make docs-index`.",
        "",
        "| File | Language | Symbols | DocAsCode |",
        "|---|---:|---:|---|",
    ]

    for item in indexes:
        lines.append(
            f"| `{item.path}` | {item.language} | {len(item.symbols)} | {tag_summary(item.tags)} |"
        )

    return "\n".join(lines) + "\n"


def render_modules(indexes: list[FileIndex]) -> str:
    grouped: dict[str, list[FileIndex]] = {}
    for item in indexes:
        default_module = item.path.rsplit("/", 1)[0] if "/" in item.path else "."
        module = item.tags.get("module") or default_module
        grouped.setdefault(module, []).append(item)

    lines = [
        "# Modules Index",
        "",
        "Generated by `make docs-index`.",
        "",
    ]

    for module in sorted(grouped):
        lines.extend([f"## `{module}`", ""])
        for item in sorted(grouped[module], key=lambda entry: entry.path):
            public_symbols = [
                symbol for symbol in item.symbols if "public" in symbol.tags
            ]
            public_summary = ", ".join(f"`{symbol.name}`" for symbol in public_symbols) or "-"
            lines.append(f"- `{item.path}`: {len(item.symbols)} symbols; public API: {public_summary}")
        lines.append("")

    return "\n".join(lines)


def render_functions(indexes: list[FileIndex]) -> str:
    symbols = sorted(
        (symbol for item in indexes for symbol in item.symbols),
        key=lambda symbol: (symbol.path, symbol.name, symbol.line),
    )

    lines = [
        "# Functions And Symbols Index",
        "",
        "Generated by `make docs-index`.",
        "",
        "| Symbol | Kind | Location | DocAsCode |",
        "|---|---:|---|---|",
    ]

    for symbol in symbols:
        lines.append(
            f"| `{symbol.name}` | {symbol.kind} | `{symbol.path}:{symbol.line}` | {tag_summary(symbol.tags)} |"
        )

    return "\n".join(lines) + "\n"


def render_readme() -> str:
    return "\n".join(
        [
            "# Code Indexes",
            "",
            "These files are generated by `make docs-index` from source code and DocAsCode comments.",
            "",
            "## Files",
            "",
            "- `files.md` maps code files to languages, symbol counts, and file-level DocAsCode tags.",
            "- `modules.md` groups files by `@module` or directory and highlights symbols marked with `@public`.",
            "- `functions.md` lists discovered functions, classes, exported symbols, SQL objects, and JSON root keys.",
            "",
            "## DocAsCode Tags",
            "",
            "Place tags in comments near the file header or directly above a symbol:",
            "",
            "```ts",
            "// @module shared/api",
            "// @public",
            "// @description Fetches camp catalog data",
            "export async function fetchCamps() {}",
            "```",
            "",
            "Supported tags are intentionally open-ended. Common tags: `@index`, `@module`, `@public`, `@description`, `@example`.",
            "",
            "Generated output is sorted and contains no timestamps, so diffs stay stable.",
            "",
        ]
    )


def write_indexes(indexes: list[FileIndex]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    outputs = {
        "README.md": render_readme(),
        "files.md": render_files(indexes),
        "modules.md": render_modules(indexes),
        "functions.md": render_functions(indexes),
    }

    for filename, content in outputs.items():
        (OUT_DIR / filename).write_text(content, encoding="utf-8")


def main() -> None:
    indexes = build_indexes()
    write_indexes(indexes)
    print(f"Generated {len(indexes)} file entries in {relative_path(OUT_DIR)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Step 1 – Narration Preparation
Turn a markdown/MDX blog post into clean narration text (no LLM required).

Usage:
    python generate_narration.py [--output FILE]

Requirements: see requirements.txt
fzf must be installed for the fuzzy post picker (https://github.com/junegunn/fzf).
"""

import argparse
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import frontmatter

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = REPO_ROOT / "src" / "content" / "blog"

# ---------------------------------------------------------------------------
# MDX → plain text
# ---------------------------------------------------------------------------

def strip_mdx(content: str) -> str:
    """Strip MDX/JSX/markdown syntax to produce clean prose for TTS."""
    # Remove import / export statements
    content = re.sub(r"^(import|export)\s+.*$", "", content, flags=re.MULTILINE)
    # Remove JSX/HTML tags
    content = re.sub(r"</?[A-Za-z][^>\n]*>", "", content)
    # Remove HTML comments
    content = re.sub(r"<!--.*?-->", "", content, flags=re.DOTALL)
    # Remove fenced/indented code blocks and inline code
    content = re.sub(r"```[^\n]*\n[\s\S]*?```", "", content)
    content = re.sub(r"~~~[^\n]*\n[\s\S]*?~~~", "", content)
    content = re.sub(r"^(?: {4}|\t).*$", "", content, flags=re.MULTILINE)
    content = re.sub(r"`[^`]+`", "", content)
    # Remove image syntax
    content = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", content)
    # Links → link text only
    content = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", content)
    # Reference-style links and footnotes
    content = re.sub(r"^\[[^\]]+\]:\s+.*$", "", content, flags=re.MULTILINE)
    content = re.sub(r"\[\^[^\]]+\]", "", content)
    # Remove ATX headings markers (keep heading text on its own line)
    content = re.sub(r"^#{1,6}\s+", "", content, flags=re.MULTILINE)
    # Remove blockquote markers
    content = re.sub(r"^>\s?", "", content, flags=re.MULTILINE)
    # Remove list item markers
    content = re.sub(r"^\s*[-*+]\s+", "", content, flags=re.MULTILINE)
    content = re.sub(r"^\s*\d+[.)]\s+", "", content, flags=re.MULTILINE)
    # Remove setext-style underline headings
    content = re.sub(r"^[=\-]{3,}$", "", content, flags=re.MULTILINE)
    # Remove horizontal rules
    content = re.sub(r"^[-*_]{3,}$", "", content, flags=re.MULTILINE)
    # Remove markdown table separators
    content = re.sub(r"^\|?\s*[:-]+\s*(\|\s*[:-]+\s*)+\|?$", "", content, flags=re.MULTILINE)
    content = re.sub(r"\|", " ", content)
    # Bold / italic markers
    content = re.sub(r"\*{1,3}([^*\n]+)\*{1,3}", r"\1", content)
    content = re.sub(r"_{1,3}([^_\n]+)_{1,3}", r"\1", content)
    # Keep plain readable punctuation only
    content = unicodedata.normalize("NFKC", content)
    content = (
        content.replace("&", " and ")
        .replace("…", "...")
        .replace("—", "-")
        .replace("–", "-")
    )
    content = re.sub(r"[•◆▪▶►●■□]", " ", content)
    content = re.sub(r"\s+/\s+", " or ", content)
    content = re.sub(r"[ \t]+", " ", content)
    # Collapse excess blank lines
    content = re.sub(r"\n{3,}", "\n\n", content)
    return content.strip()


def build_narration(post: dict, include_title: bool = True, include_description: bool = True) -> str:
    """Build clean narration text from post metadata + cleaned body."""
    parts: list[str] = []

    if include_title and post.get("title"):
        title = str(post["title"]).strip().rstrip(".")
        if title:
            parts.append(f"{title}.")

    if include_description and post.get("description"):
        description = str(post["description"]).strip().rstrip(".")
        if description:
            parts.append(f"{description}.")

    body = strip_mdx(post["content"])
    if body:
        parts.append(body)

    narration = "\n\n".join(parts).strip()
    narration = re.sub(r"\n{3,}", "\n\n", narration)
    return narration


# ---------------------------------------------------------------------------
# Post loading
# ---------------------------------------------------------------------------

def load_posts() -> list[dict]:
    """Return all non-draft blog posts sorted newest first."""
    paths = sorted(
        list(BLOG_DIR.glob("**/*.md")) + list(BLOG_DIR.glob("**/*.mdx")),
        reverse=True,
    )
    posts = []
    for path in paths:
        try:
            post = frontmatter.load(str(path))
            if post.metadata.get("draft", False):
                continue
            posts.append(
                {
                    "path": path,
                    "title": post.metadata.get("title", path.stem),
                    "description": post.metadata.get("description", ""),
                    "content": post.content,
                }
            )
        except Exception as exc:
            print(f"Warning: could not parse {path}: {exc}", file=sys.stderr)
    return posts


def find_post(posts: list[dict], query: str) -> dict | None:
    """Find a post by slug, exact file path, file name, or fuzzy title match."""
    needle = query.strip().lower()
    if not needle:
        return None

    for post in posts:
        slug = post["path"].stem.lower()
        if needle == slug:
            return post

        path_str = str(post["path"]).lower()
        if needle == path_str or path_str.endswith(needle):
            return post

        if needle == post["path"].name.lower():
            return post

    fuzzy = [p for p in posts if needle in p["title"].lower() or needle in p["path"].stem.lower()]
    if len(fuzzy) == 1:
        return fuzzy[0]
    return None


# ---------------------------------------------------------------------------
# Post selection (fzf with fallback)
# ---------------------------------------------------------------------------

def _select_with_fzf(posts: list[dict]) -> dict:
    """Use fzf for interactive fuzzy selection."""
    # Each line: "<title>\t<filename>"  — fzf shows only the title column
    entries = [f"{p['title']}\t{p['path'].name}" for p in posts]
    result = subprocess.run(
        [
            "fzf",
            "--delimiter=\t",
            "--with-nth=1",
            "--prompt=Select post > ",
            "--height=40%",
            "--reverse",
            "--info=inline",
        ],
        input="\n".join(entries),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("No post selected.", file=sys.stderr)
        sys.exit(1)
    selected_title = result.stdout.strip().split("\t")[0]
    for p in posts:
        if p["title"] == selected_title:
            return p
    print("Could not match selection to a post.", file=sys.stderr)
    sys.exit(1)


def _select_with_prompt(posts: list[dict]) -> dict:
    """Fallback: numbered list + stdin input."""
    for i, p in enumerate(posts, 1):
        print(f"  {i:>3}. {p['title']}")
    print()
    while True:
        raw = input("Enter post number: ").strip()
        if raw.isdigit():
            idx = int(raw) - 1
            if 0 <= idx < len(posts):
                return posts[idx]
        print("Invalid selection, try again.")


def select_post(posts: list[dict]) -> dict:
    """Interactively select a post, using fzf when available."""
    try:
        subprocess.run(["fzf", "--version"], capture_output=True, check=True)
        return _select_with_fzf(posts)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("fzf not found — falling back to numbered list.\n", file=sys.stderr)
        return _select_with_prompt(posts)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate clean narration text from a markdown/MDX blog post."
    )
    parser.add_argument(
        "--post",
        metavar="SLUG_OR_PATH",
        help="Select a post non-interactively by slug, file name, or path.",
    )
    parser.add_argument(
        "--output",
        metavar="FILE",
        help="Write narration to FILE instead of stdout.",
    )
    parser.add_argument(
        "--no-title",
        action="store_true",
        help="Do not prepend the post title to the narration.",
    )
    parser.add_argument(
        "--no-description",
        action="store_true",
        help="Do not prepend the post description to the narration.",
    )
    args = parser.parse_args()

    posts = load_posts()
    if not posts:
        print(f"No blog posts found in {BLOG_DIR}", file=sys.stderr)
        sys.exit(1)

    if args.post:
        post = find_post(posts, args.post)
        if not post:
            print(f"Could not find post matching: {args.post}", file=sys.stderr)
            sys.exit(1)
    else:
        post = select_post(posts)

    print(f"\nPreparing narration for: {post['title']}\n", file=sys.stderr)

    narration = build_narration(
        post,
        include_title=not args.no_title,
        include_description=not args.no_description,
    )

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(narration, encoding="utf-8")
        print(f"\nNarration saved to: {out_path}", file=sys.stderr)
    else:
        print(narration)


if __name__ == "__main__":
    main()

# Capsule Registry

Public registry of learning capsules for the Capsule Learning Ecosystem.

## Structure

```
capsules/           ← Learning capsules (one directory per course)
capsule-cli/        ← Validation CLI tool
manifest.json       ← Auto-generated registry index
```

## Contributing a Capsule

1. Fork this repo
2. Scaffold a new capsule: `bun capsule-cli/src/index.ts init my-course -d capsules`
3. Write your content in `capsules/my-course/`
4. Validate: `bun capsule-cli/src/index.ts validate capsules/my-course`
5. Open a PR — CI will validate automatically

## Capsule Format

Each capsule is a directory with:
- `capsule.yaml` — Course metadata (schema-validated)
- `lessons/` — Lesson content (Markdown)
- `labs/` — Hands-on exercises (Markdown)
- `quizzes/` — Assessments (Markdown with `[x]` correct answers)
- `README.md` — Course description

See `capsules/intro-to-linux/` for a working example.

## CLI Commands

```bash
cd capsule-cli && bun install

# Validate a capsule
bun src/index.ts validate ../capsules/intro-to-linux

# Scaffold a new capsule
bun src/index.ts init my-course -d ../capsules

# Rebuild the manifest
bun src/index.ts build-manifest ../capsules -o ../manifest.json
```

# MetaFlow

An [Obsidian](https://obsidian.md) plugin that automatically applies metadata rules: when a new markdown file is created inside a watched folder, MetaFlow writes the rule's properties into its frontmatter.

## Use cases

- Tag files synced from external tools (e.g. calendar events synced by another plugin) so Dataview/Bases can query them
- Auto-tag incoming notes per folder (`food`, `meeting`, ...)
- Inject standard properties like `type` or `source` without touching templates

## Usage

1. Open *Settings → MetaFlow*
2. Click **+ 新增规则** and pick a folder to watch
3. Add properties (key/value pairs); a value containing commas becomes a list, e.g. `calendar, sync` → `[calendar, sync]`
4. Every new `.md` file created inside that folder gets the properties written to its frontmatter

Rules apply to newly created files only — files that already exist are not rewritten.

## Development

No build step required — `main.js` is plain JavaScript and can be edited directly.

## License

[MIT](LICENSE)

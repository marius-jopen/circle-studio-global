# People Import Tool

Script to import people data from CSV into Prismic's `people` content type.

## Requirements
- Node 18+
- Repo dependencies installed (`npm i`)
- Prismic write token and access token

## Environment setup (.env)
Create a `.env` file at the project root:

```
PRISMIC_WRITE_TOKEN=your_write_token
PRISMIC_ACCESS_TOKEN=your_access_token
```

## Usage

1) Dry run to preview what will be created:

```bash
node migration/people-import.mjs --file="./static/Circle Studio Global Webpage Tracker.csv"
```

2) Apply the migration:

```bash
node migration/people-import.mjs --file="./static/Circle Studio Global Webpage Tracker.csv" --dry-run=false
```

## Behavior
- Parses CSV with columns: Name, Instagram Link, Column3, Column4
- Creates people documents with `name` and `link` fields
- Generates UIDs from names (lowercase, hyphenated, special chars removed)
- Removes trailing `#` from Instagram links
- Skips empty rows and header row
- Handles duplicate UIDs by letting Prismic handle conflicts

## Notes
- Repository name is read from `slicemachine.config.json`
- Uses both write token and access token as per Prismic support recommendation
- Instagram links are stored as Web links in Prismic
- People without Instagram links get a generic "Any" link type

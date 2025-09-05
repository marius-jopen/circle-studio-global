# Migration Functions

Active scripts for Prismic data migration.

## Scripts

### `csv-to-json.mjs`
Converts CSV data to Prismic-ready JSON format.

**Usage:**
```bash
node migration/functions/csv-to-json.mjs
```

**Output:**
- `migration/output/people-data.json` - Full data with metadata
- `migration/output/people-prismic-format.json` - Ready for Migration API
- `migration/output/export-summary.json` - Processing summary

### `people-import-from-json-final.mjs`
Main migration script that imports people from JSON to Prismic.

**Usage:**
```bash
# Import all 252 people
node migration/functions/people-import-from-json-final.mjs

# Import first 10 people
node migration/functions/people-import-from-json-final.mjs 10

# Import just 1 person
node migration/functions/people-import-from-json-final.mjs 1
```

**Features:**
- Uses JSON as source (more reliable than CSV parsing)
- Generates unique UIDs with timestamps
- Rate limiting (1 second between requests)
- Progress tracking and error handling
- Creates documents in Migration Release (draft state)

### `check-existing-documents.mjs`
Diagnostic script to check what documents exist in Prismic.

**Usage:**
```bash
node migration/functions/check-existing-documents.mjs
```

**Output:**
- Lists all people documents found
- Shows release information
- Helps verify migration success

### `check-migration-release.mjs`
Advanced diagnostic script to check Migration Release status.

**Usage:**
```bash
node migration/functions/check-migration-release.mjs
```

**Output:**
- Repository information
- Available refs and releases
- Document visibility analysis

## Migration Workflow

1. **Prepare data**: Run `csv-to-json.mjs`
2. **Test import**: Run `people-import-from-json-final.mjs 1`
3. **Verify**: Run `check-existing-documents.mjs`
4. **Full import**: Run `people-import-from-json-final.mjs`
5. **Publish**: Go to Prismic dashboard and publish Migration Release

## Environment Variables

Required in `.env` file:
- `PRISMIC_WRITE_TOKEN` - For creating documents
- `PRISMIC_ACCESS_TOKEN` - For reading documents

## Important Notes

- Documents created via Migration API are in draft state
- You must manually publish the Migration Release in Prismic dashboard
- The Content API won't show draft documents until published
- This is expected behavior, not a bug

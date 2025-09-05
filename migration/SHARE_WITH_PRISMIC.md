# What to Share with Prismic Team

This document outlines what to include when sharing the migration tools with the Prismic team for support or review.

## Files to Include

### Essential Files
- `migration/README.md` - Main documentation
- `migration/functions/` - All active migration scripts
- `migration/input/` - Sample CSV data
- `migration/output/` - Generated JSON data
- `migration/.env.example` - Environment template

### Scripts in functions/
- `csv-to-json.mjs` - Data preparation
- `people-import-from-json-final.mjs` - Main migration script
- `check-existing-documents.mjs` - Diagnostic tool
- `check-migration-release.mjs` - Advanced diagnostics
- `README.md` - Functions documentation

## Files to EXCLUDE

### Never Share
- `.env` file (contains real API tokens)
- `node_modules/` folder
- `legacy/` folder (experimental code)
- Any files with real credentials

## What the Prismic Team Needs to Know

### The Issue
- Documents created via Migration API return 201 success
- Documents are not visible via Content API (403 Forbidden)
- Documents don't appear in Prismic dashboard

### The Solution
- Documents are created in a "Migration Release" in draft state
- Must manually publish the release in Prismic dashboard
- This is expected behavior, not a bug

### The Workflow
1. Prepare CSV data with `csv-to-json.mjs`
2. Import with `people-import-from-json-final.mjs`
3. Check with `check-existing-documents.mjs`
4. Publish Migration Release in dashboard

### Key Technical Details
- Using Migration API (not Content API) for creation
- Using Content API for verification
- Documents have unique UIDs with timestamps
- Rate limiting implemented (1 second between requests)
- Proper error handling and progress tracking

## Questions for Prismic Team

1. Is there a way to create published documents directly via Migration API?
2. Can we programmatically publish a Migration Release?
3. Are there any best practices for bulk document creation?
4. Should we use a different approach for this use case?

## Sample Data

The migration handles 252 people with:
- Names (required)
- Instagram links (optional)
- Generated UIDs from names
- Proper Prismic document structure

## Environment Setup

The team will need:
- Prismic write token
- Prismic access token
- Repository name: circle-studio-global
- Content type: people

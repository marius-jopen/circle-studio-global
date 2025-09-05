# Prismic Support Request: Migration API Document Visibility Issue

## Issue Summary

We're experiencing an issue where documents created via the Prismic Migration API return successful responses (201 status) but are not visible through the Content API or in the Prismic dashboard. The documents appear to be created in a "Migration Release" in draft state, but we need clarification on the expected workflow.

## What We're Sharing

- **Repository**: [Your repo link]
- **Environment Variables**: [Your ENV keys]
- **Migration Code**: Located in the `migration/` folder
- **Sample Data**: 252 people records with names and Instagram links

## Technical Details

### Our Setup
- **Repository**: circle-studio-global
- **Content Type**: people
- **Migration Method**: Prismic Migration API (https://migration.prismic.io/documents)
- **Verification Method**: Prismic Content API
- **Tokens**: Both write token and access token configured

### The Problem
1. **Document Creation**: Successfully creates documents via Migration API
   - Returns 201 status
   - Returns document ID
   - No errors reported

2. **Document Visibility**: Documents not visible via Content API
   - Content API returns 403 Forbidden
   - No documents found in dashboard
   - Documents don't appear in published content

3. **Migration Release**: Documents appear to be in a "Migration Release"
   - This is mentioned in Prismic documentation
   - Documents are in draft state
   - Need manual publishing in dashboard

## Our Questions

1. **Is this expected behavior?** Are documents created via Migration API supposed to be in draft state initially?

2. **How do we publish Migration Releases programmatically?** Is there an API endpoint to publish the Migration Release?

3. **Is there a way to create published documents directly?** Can we skip the draft state and create published documents immediately?

4. **What's the recommended workflow?** Should we:
   - Create documents via Migration API (draft)
   - Publish Migration Release manually
   - Or use a different approach entirely?

## Our Current Workflow

1. **Data Preparation**: Convert CSV to Prismic-ready JSON format
2. **Document Creation**: Use Migration API to create people documents
3. **Verification**: Check if documents are visible (currently failing)
4. **Publishing**: Manual publishing in dashboard (if this is the correct approach)

## Code Structure

The migration code is organized in the `migration/` folder:

- `functions/` - Active migration scripts
- `input/` - Source CSV data
- `output/` - Generated JSON data
- `README.md` - Documentation

## Sample Data

We're migrating 252 people records with:
- Names (required)
- Instagram links (optional)
- Generated UIDs from names
- Proper Prismic document structure

## Environment

- Node.js 18+
- Prismic client library
- Both write and access tokens configured
- Repository: circle-studio-global

## Expected Outcome

We want to:
1. Create 252 people documents in Prismic
2. Have them visible via Content API
3. Have them appear in the Prismic dashboard
4. Understand the proper workflow for bulk document creation

## Additional Context

This is for a client project where we need to migrate existing data from CSV to Prismic. The Migration API seemed like the right approach for bulk creation, but we're unclear on the publishing workflow.

Thank you for your help in clarifying the expected behavior and workflow for the Migration API.

---

**Contact Information**: [Your contact details]
**Repository**: [Your repo link]
**Environment**: [Your ENV keys]

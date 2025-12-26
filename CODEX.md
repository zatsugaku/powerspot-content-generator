# Powerspot Article Generator - Codex CLI Guide

## Project Overview

This project generates SEO-optimized powerspot articles and auto-posts them to WordPress.

### Features
- 142 powerspot database (JSON)
- 4,500-5,000 word articles (Japanese & English)
- WordPress REST API auto-posting
- Pexels API image fetching
- Auto taxonomy setup (region, area, type, benefits)

---

## Directory Structure

```
powerspot-content-generator/
├── articles/           # Generated articles (Markdown)
├── images/             # Downloaded images
├── instructions/       # Article generation instructions
│   └── ARTICLE_GENERATION_MASTER.md  # Main instruction
├── scripts/
├── 04_powerspot_database.json        # Powerspot database
├── generate-from-db.js               # Get powerspot info
├── generate-html-preview.js          # HTML preview
├── post-from-markdown-styled.js      # WordPress posting
├── check-post.js                     # Post verification
├── .env                              # Environment variables
└── CODEX.md                          # This file
```

---

## Quick Start

### 1. Setup

```bash
npm install
cp .env.example .env
# Edit .env with WordPress credentials
```

### 2. Generate Article

```bash
# Check next powerspot (index 18 = 19th spot, first unprocessed)
node generate-from-db.js 1 18

# Follow instructions/ARTICLE_GENERATION_MASTER.md to create article
# Save as articles/[powerspot-name].md
```

### 3. Post to WordPress

```bash
# Post article
node post-from-markdown-styled.js articles/[name].md

# Verify post
node check-post.js [post-id]
```

---

## Article Workflow

### Step 1: Identify Target Powerspot
```bash
node generate-from-db.js 1 [offset]
```

### Step 2: Create Japanese Article
- Read `instructions/ARTICLE_GENERATION_MASTER.md`
- 4,500-5,000 characters
- 11 sections structure
- Save to `articles/[name].md`

### Step 3: Create English Article
- Translate Japanese article
- Add Japanese culture explanations
- Save to `articles/[slug]-en.md`

### Step 4: Fetch Images
- Use Pexels API for 5 body images + 1 featured image
- Verify each image with Read tool
- NO location-identifiable signs/text
- NO famous landmarks (Mt. Fuji, etc.)

### Step 5: Update POWERSPOT_MAPPING
Add entry to `post-from-markdown-styled.js`:
```javascript
'PowerspotName': {
  rank: number,
  region: 'Prefecture',
  slug: 'url-slug',
  type: 'shrine/temple/nature',
  benefits: ['benefit1', 'benefit2'],
  featuredImage: imageId
},
```

### Step 6: Post to WordPress
```bash
node post-from-markdown-styled.js articles/[name].md
```

### Step 7: Fix English Slug
English articles need slug update after posting:
- Format: `{japanese-slug}-en`
- Example: `hokkaido-jingu-en`

### Step 8: Verify
```bash
node check-post.js [post-id]
```

---

## Completed Articles (18 done)

| Rank | Powerspot | JP | EN |
|------|-----------|----|----|
| 1 | Ise Jingu | OK | OK |
| 2 | Fushimi Inari | OK | OK |
| 3 | Sefa Utaki | OK | OK |
| 4 | Kotohira-gu | OK | OK |
| 5 | Izumo Taisha | OK | OK |
| 6 | Mt. Aso | OK | OK |
| 7 | Nikko Toshogu | OK | OK |
| 8 | Mt. Haguro | OK | OK |
| 9 | Chusonji | OK | OK |
| 10 | Matsushima | OK | OK |
| 11 | Osaki Hachimangu | OK | OK |
| 12 | Atsuta Jingu | OK | OK |
| 13 | Hokkaido Jingu | OK | OK |
| 14 | Tarumaesan Jinja | OK | OK |
| 15 | Lake Akan | OK | OK |
| 16 | Jozankei Jinja | OK | OK |
| 17 | Kinkengu | OK | OK |
| 18 | Sumiyoshi Taisha | OK | OK |

**Next: Rank 19 onwards**

---

## Environment Variables (.env)

```env
WP_SITE_URL=https://k005.net
WP_USERNAME=power
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx
PEXELS_API_KEY=your-api-key
```

---

## Important Rules

### DO NOT write about:
- Five Elements theory (Wood/Fire/Earth/Metal/Water)
- 12 position system
- 60 classification types
- "Recommended for XX type people"
- Birthday/name compatibility

### Image Requirements:
- 5 body images + 1 featured per article
- NO identifiable location signs
- NO famous landmarks
- Verify EACH image before use

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `generate-from-db.js [count] [offset]` | Get powerspot info from DB |
| `generate-html-preview.js [file]` | Create HTML preview |
| `post-from-markdown-styled.js [file]` | Post to WordPress |
| `check-post.js [id]` | Verify WordPress post |
| `add-related-links.js` | Add internal links |

---

Last updated: 2025-12-26

# Step 2: Data API Discovery for Movivid

**Date**: May 10, 2026  
**Status**: In Progress - Testing APIs

## Data Sources Available

### 1. OMDb API ✅ (Working)
**Status**: Activated and tested  
**API Key**: Stored in `.env`  
**Base URL**: `http://www.omdbapi.com/`

**Capabilities**:
- ✅ Search movies by title
- ✅ Get detailed movie information by IMDb ID
- ✅ Ratings from multiple sources (IMDb, Rotten Tomatoes, Metacritic)
- ✅ Basic metadata (year, director, genre, plot, actors, runtime)
- ✅ Poster images

**What OMDb Provides**:
```json
{
  "Title": "The Matrix",
  "Year": "1999",
  "Director": "Lana Wachowski, Lilly Wachowski",
  "Genre": "Action, Sci-Fi",
  "Plot": "...",
  "Actors": "...",
  "imdbRating": "8.7",
  "imdbID": "tt0133093",
  "Ratings": [
    {"Source": "Internet Movie Database", "Value": "8.7/10"},
    {"Source": "Rotten Tomatoes", "Value": "88%"},
    {"Source": "Metacritic", "Value": "73/100"}
  ]
}
```

**What OMDb DOESN'T Provide**:
- ❌ Netflix availability
- ❌ Thematic tags (existential, loss, identity, etc.)
- ❌ Life situation mappings (grief, isolation, career change)
- ❌ Philosophical themes
- ❌ Critical analysis
- ❌ Spoiler-free summaries

---

### 2. uNoGS API ⏳ (Needs RapidAPI Subscription)
**Status**: API key obtained, subscription required  
**API Key**: Stored in `.env`  
**Platform**: RapidAPI  
**Host**: `unogs-unogs-v1.p.rapidapi.com`

**Expected Capabilities** (once subscribed):
- Search Netflix catalog
- Filter by country/region
- Get Netflix-specific IDs
- Track when titles are added/removed
- Filter by rating, year, genre

**What uNoGS Would Provide**:
- Netflix availability by region
- Netflix internal IDs
- Catalog updates (new additions)
- Filtering for "best" films

**Next Steps**:
1. Activate RapidAPI subscription for uNoGS
2. Test API endpoints
3. Map IMDb IDs to Netflix IDs
4. Build sync mechanism for catalog updates

---

### 3. Thematic Data (Manual Curation Needed)
**Status**: Not yet built  
**Source**: Manual preprocessing

**What We Need to Add**:
For each film in our catalog, we need:

```json
{
  "imdb_id": "tt0133093",
  "title": "The Matrix",
  "themes": [
    "reality vs illusion",
    "identity",
    "choice vs fate",
    "awakening",
    "rebellion"
  ],
  "life_situations": [
    "questioning reality",
    "feeling trapped",
    "seeking purpose",
    "awakening to truth"
  ],
  "emotions": [
    "confusion",
    "curiosity",
    "empowerment",
    "rebellion"
  ],
  "philosophical_focus": "What is real? Do we have free will?",
  "movivid_learned": "What I got from The Matrix was that sometimes the comfortable prison is harder to escape than the difficult truth.",
  "spoiler_free_summary": "...",
  "character_journey": "discovery of self and purpose",
  "suitable_for": [
    "career transitions",
    "questioning life choices",
    "feeling stuck"
  ]
}
```

**Preprocessing Strategy**:
1. Start with "Movivid 100" - curated list of meaningful films on Netflix
2. For each film:
   - Watch or research film
   - Extract themes manually or with GPT assistance
   - Map to life situations
   - Write "what Movivid learned" from first-person perspective
   - Create spoiler-free summary
3. Store in JSON file or database
4. Update quarterly

---

### 4. InternetToText (Web Search for Film Analysis)
**Status**: To be built in Step 3  
**Use cases**:
- Critical reviews and analysis
- Philosophical interpretations
- Recent discussions about films
- User opinions and reactions

**Sources**:
- Film criticism sites (Roger Ebert, IndieWire, etc.)
- Philosophy/film analysis
- Reddit film discussions
- Academic papers on film themes

---

## Data Architecture

### Recommended Structure

```
Film Data = OMDb (basic info) 
          + uNoGS (Netflix availability) 
          + Thematic Data (manual curation) 
          + InternetToText (reviews/analysis on demand)
```

### Storage

**movivid_catalog.json** (or SQLite database):
```json
[
  {
    "imdb_id": "tt0133093",
    "netflix_id": "...",
    "omdb_data": {
      // Cached from OMDb API
    },
    "movivid_data": {
      "themes": [...],
      "life_situations": [...],
      "emotions": [...],
      "philosophical_focus": "...",
      "movivid_learned": "...",
      "spoiler_free_summary": "...",
      "suitable_for": [...]
    },
    "last_updated": "2026-05-10",
    "on_netflix": true,
    "netflix_regions": ["US", "UK", "CA"]
  }
]
```

---

## Gaps Analysis

| Data Need | Source | Status |
|-----------|--------|--------|
| Basic film info | OMDb | ✅ Working |
| Netflix availability | uNoGS | ⏳ Need subscription |
| Themes | Manual curation | ❌ Not started |
| Life situations | Manual curation | ❌ Not started |
| Philosophical meaning | Manual curation | ❌ Not started |
| Movivid's learnings | Manual curation | ❌ Not started |
| Reviews/analysis | InternetToText | ⏳ Step 3 |

---

## Next Actions

**Immediate (to complete Step 2)**:
1. ✅ Document OMDb capabilities (done)
2. ⏳ Activate uNoGS RapidAPI subscription
3. ⏳ Test uNoGS endpoints
4. ⏳ Build uNoGS API wrapper class

**Short-term (after Step 2)**:
1. Curate "Movivid 100" list of films
2. Begin thematic preprocessing
3. Build InternetToText functions (Step 3)
4. Set up Wordalisations DB (Step 4)

**Decision Point**: Should we start with 10-20 films for prototyping before full 100?

---

## Learning Notes

- **OMDb strength**: Excellent for basic film metadata and ratings
- **uNoGS purpose**: Netflix catalog tracking (what's actually available)
- **Manual curation critical**: The philosophical/thematic layer is Movivid's unique value
- **InternetToText complements**: Adds fresh analysis and perspectives

This hybrid approach (APIs + curation + web search) gives Movivid both structure and depth.

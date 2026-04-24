# Vultur — Take-Home Assessment

## Overview

Build a candidate-role matching tool for [Vultur](https://vultur.ai). You have **~2,000 enriched LinkedIn contacts** and a **live job board to scrape**. Design a scoring algorithm that ranks candidates against roles, then build a UI to explore the results.

**Time budget:** 2–3 hours
**Stack:** Next.js + Tailwind CSS (starter included)

---

## Getting Started

1. Click **"Use this template"** → **"Create a new repository"** (make it **private**)
2. Clone your new repository locally
3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## The Data

### Contacts (provided)

`data/contacts.csv` contains ~2,087 enriched LinkedIn profiles. Columns:

| Column | Description |
|--------|-------------|
| `id` | Unique identifier (`c-0001`, `c-0002`, ...) |
| `firstName` | First name |
| `lastName` | Last name |
| `linkedinUrl` | LinkedIn profile URL |
| `currentCompany` | Current employer |
| `currentTitle` | Current job title |
| `headline` | LinkedIn headline |
| `location` | Location (e.g. "London, UK") |
| `about` | LinkedIn "About" section |
| `topSkills` | Comma-separated list of top skills |
| `experienceSummary` | Work history — pipe-separated entries formatted as `Title @ Company (duration) [Current]` |
| `educationSummary` | Education — pipe-separated entries formatted as `Degree, Field, School` |
| `connectionsCount` | Number of LinkedIn connections |
| `openToWork` | Whether the contact has the "Open to Work" signal (`True`/`False`) |
| `certifications` | Pipe-separated list of professional certifications |

### Jobs (you scrape these)

Fetch job listings from: **https://jobs.ashbyhq.com/stackone**

Extract whatever fields you find useful — title, department, location, description, requirements — and structure them for matching.

> **Tip:** The page is a React SPA. Inspect the page source for embedded data rather than trying to scrape rendered HTML.

If scraping takes too long, you may manually create a `roles.json` from the visible listings. Automated extraction is preferred and will be noted in evaluation, but won't block you from completing the rest of the assessment.

---

## What to Build

### 1. Data Loading & Job Extraction

- Parse and load contacts from the provided CSV
- Fetch and parse job listings from the Ashby careers page
- Type the data appropriately in TypeScript

### 2. Matching Algorithm

Build a scoring function that ranks contacts against each role. You decide:

- Which signals matter (skills overlap, experience relevance, location, seniority, availability, etc.)
- How to weight them
- How to handle edge cases (missing data, career changers, remote roles)

There is no single correct approach. We're evaluating your reasoning about what makes a good match and how you translate that into code.

### 3. Curation UI

Build an interface that lets a user:

- Browse the job roles
- View ranked candidates for a selected role
- See a score breakdown explaining **why** each candidate matched
- Use the Vultur logo (provided in `/public/logos/`) in the header

Beyond these requirements, the UI is yours to design. Prioritize clarity and usability.

---

## Evaluation Criteria

| Criteria | Weight | What we look for |
|----------|--------|------------------|
| **Algorithm Design** | 35% | Signal selection, weighting logic, handling of edge cases, score explainability |
| **UI & UX** | 30% | Clean layout, intuitive navigation, responsive design, effective data presentation |
| **Code Quality** | 25% | TypeScript usage, component structure, readability, separation of concerns |
| **Creativity** | 10% | Bonus features, clever scoring approaches, thoughtful UX touches |

---

## Bonus Ideas (optional)

- Search or filter candidates across roles
- Side-by-side candidate comparison
- Visual score breakdowns (charts, bars, color coding)
- Candidate detail view with full profile
- Export or shortlist functionality
- Dark mode using Vultur brand colors

---

## Submission

- Push your completed work to your forked repo
- Include a `NOTES.md` explaining your algorithm design decisions
- Ensure `npm run build` passes with no errors
- Share the repo link with us

## Brand Assets

Vultur logos are in `/public/logos/`. Use the ember (orange) or black variant.

Brand color (Ember): `#CD5700`

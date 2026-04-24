# Design Notes
I SUCK at front end, so I literally had to use some Excalidraw into opencode. I sketched out the actual code in Python before doing anything, and then converted it to TypeScript.

## Algorithm Design
### Signals Used

I selected six signals which I find to be relevant to the problem: (the percentage is weight in the ranking)

1. **Skills**: (35%) ~50 tech/business terms from both the job title / team and candidate's full profile. 
2. **Experience Relevance**: (25%) Looks at title/company keyword overlap across all experience entries, weighted towards current roles.
3. **Location Fit**: (15%) Remote jobs give everyone 100%, otherwise it's a city/country match, with a fallback to regional matching (US,UK,EU,IN, as those are the ones actually found in the job post page./)
4. **Seniority** (10%) 8-level seniority scale, intern --> founder/CTO.
5. **Availability** (5%) Simple enough, "Open to Work" = 100, else = 50
6. **Education Relevance** (10%) Checks if the candidate's field of study aligns with terms in the job title. Defaults to 50 if education exists, 30 if none.

### Edge Cases

- **Missing data**: Contacts with empty skills/experience/education get baseline scores (20-50) rather than zero, so they're not completely excluded.
- **Jobs with few keywords**: If a job title returns no extractable keywords, skills score defaults to 50 (neutral).

## Trade-offs

- **Fixed keyword list**: About 50~ terms.
- **No job description parsing**: Matching is based on title, team, and location only. (Can be extended relatively easy)

## What I'd Do With More Time

- **Candidate comparison**: Side-by-side view of 2-3 candidates for the same role.

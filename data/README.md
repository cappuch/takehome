# Data

## contacts.csv

~2,087 enriched LinkedIn connections of [Henry Allen](https://linkedin.com/in/henryallen), founder of Vultur.

Each row is a LinkedIn contact with enriched profile data including work history, education, skills, and availability signals. The data was exported from Vultur's internal database.

### Columns

| Column | Description |
|--------|-------------|
| `id` | Unique identifier (`c-0001`, `c-0002`, ...) |
| `firstName` | First name |
| `lastName` | Last name |
| `linkedinUrl` | LinkedIn profile URL |
| `currentCompany` | Current employer (derived from most recent experience) |
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

### Notes

- Multi-value fields use `|` as a delimiter (experienceSummary, educationSummary, certifications)
- Some contacts have sparse profiles — missing `about`, `topSkills`, or `educationSummary` fields are expected
- `currentCompany` and `currentTitle` are derived from the most recent experience entry marked `[Current]`

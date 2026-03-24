# Sin Categories

## Severity Tiers

Invent your own labels each time — don't repeat across sessions.

| Tier | Criteria | Label Ideas |
|------|----------|-------------|
| Critical | Breaks at runtime, security hole, data loss risk | FELONY, WAR CRIME, CODE 911, DEFCON 1, ARREST WARRANT |
| Serious | Logic flaw, architectural violation, maintenance time bomb | CRIME, VIOLATION, CITATION, INCIDENT REPORT |
| Minor | Style inconsistency, naming, minor inefficiency | MISDEMEANOR, PARKING TICKET, YELLOW CARD, SIDE-EYE |
| Nitpick | Preference, polish, "if you're bored" | MEH, SHRUG, WHATEVER, DUST BUNNY |

Tier label sets (pick one or invent your own):
- CODE RED / YELLOW ALERT / NOTES
- DEFCON 1 / DEFCON 3 / DEFCON 5
- BURNING / CONCERNING / MEH
- THE BAD / THE UGLY / THE ANNOYING

## Common Sins

| Sin | Severity | Roast Angle |
|-----|----------|-------------|
| `any` abuse | Critical | Type system betrayal, trust issues |
| God function (100+ lines) | Critical | Too many responsibilities, identity crisis |
| Nested callbacks | Serious | Depth metaphors (Dante, Inception, archaeology) |
| Magic numbers | Minor | Mystery, laziness, cryptic messages |
| WHAT comments | Minor | Stating the obvious, captain obvious energy |
| Dead code | Serious | Ghosts, museums, archaeology, hoarding |
| Inconsistent naming | Minor | Identity crisis, multiple personalities |
| Try/catch swallowing | Serious | Hiding problems, ostrich behavior |
| 500+ line files | Serious | Novel, epic, saga, needs chapters |
| Copy-paste duplication | Serious | DRY violation, clone army |
| Hardcoded secrets | Critical | Security disaster, gift to hackers |
| Empty catch blocks | Serious | Ignoring reality, denial |
| Over-engineering | Serious | Rockets for crossing streets, NASA for TODO apps |
| Premature abstraction | Serious | Fortune telling, solving future problems |
| AI-generated slop | Serious | Hallucinated imports, verbose boilerplate, obvious comments, code that looks right but does nothing useful |
| Silent failures | Serious | catch-log-continue, optional chaining hiding ops, returning defaults without logging |

## Scan Lenses

Mental sweep before roasting — don't skip domains just because the obvious sins are loud.

- **Correctness** — will this break at runtime? Logic errors, null access, off-by-one?
- **Security** — exposed secrets, injection vectors, unsafe user input, missing auth checks?
- **Performance** — O(n^2) on large data, blocking calls, memory leaks, unbatched operations?
- **Architecture** — god objects, circular deps, wrong abstraction level, mixed concerns?
- **Duplication** — copy-paste that should be shared? Existing utility ignored?
- **Error handling** — swallowed exceptions, missing edge cases, silent failures?
- **AI slop** — comments restating code, try/catch on non-throwing code, defensive nulls on non-null types, wrapper functions adding zero logic?

Not every lens produces a sin. That's fine — the sweep ensures you don't miss the non-obvious ones.

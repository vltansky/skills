# QA Health Score Rubric

Compute each category score (0-100), then take the weighted average.

## Console (weight: 15%)
- 0 errors → 100
- 1-3 errors → 70
- 4-10 errors → 40
- 10+ errors → 10

## Links (weight: 10%)
- 0 broken → 100
- Each broken link → -15 (minimum 0)

## Per-Category Scoring

Each of these starts at 100. Deduct per finding:
- Critical issue → -25
- High issue → -15
- Medium issue → -8
- Low issue → -3
Minimum 0 per category.

## Weights

| Category | Weight |
|----------|--------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

## Final Score

`score = Σ (category_score × weight)`

## Example

App with 1 critical functional bug, 2 high UX bugs, 3 console errors:
- Console: 70 × 0.15 = 10.5
- Links: 100 × 0.10 = 10
- Visual: 100 × 0.10 = 10
- Functional: (100-25) × 0.20 = 15
- UX: (100-30) × 0.15 = 10.5
- Performance: 100 × 0.10 = 10
- Content: 100 × 0.05 = 5
- Accessibility: 100 × 0.15 = 15
- **Total: 86/100**

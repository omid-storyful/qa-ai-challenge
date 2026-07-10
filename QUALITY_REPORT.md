# Quality Report

## Overview

I ran the test suite against the live application using `npm run e2e`. The latest verified fresh run completed with **16 passing tests**. The golden dataset scored **75.00/100**, which falls into the **Acceptable** range in the evaluator.

 I would not treat the application as production ready. 
 
 The framework still surfaces real issues: API contract problems, invalid confidence values, and weak reasoning/category behavior on some golden examples. At the same time, it separates expected model variability from genuine defects, which was the main goal of the exercise.

---

## What I focused on

Given the time available, I focused on the areas that would matter most if they broke.

### API contracts

I tested the main API behavior including:

- authentication
- request validation
- analyze endpoint
- result lookup
- history
- history limit boundaries
- reset
- invalid or missing input

These checks matter because a contract change here would break clients immediately, even if the UI still looked fine.

### User journeys

For the UI, I covered the main flows:

- failed and successful login
- token becoming invalid mid-session
- single-item analysis with rendered result details
- three-item analysis with mixed verdict rendering
- visible per-item failure rendering when analysis fails
- social preview iframe
- loading previous history
- resetting history
- logout

Instead of relying on `data-testid`, I used accessible roles and visible text.

### UI limits

I also covered the three-item limit directly. The suite checks that a user can:

- add up to three items
- not add a fourth
- remove an item
- add another item afterwards

That gave me coverage for the main workbench constraints without turning the UI suite into a long list of near-duplicate permutations.

### Model quality

I ran all 20 examples from the golden dataset through the live API and converted the results into a single aggregate score.

### Evaluator

The evaluator has its own unit tests. That makes it easier to separate scorer bugs from application bugs.

Because the application stores shared state in memory I ran Playwright with a single worker and `fullyParallel: false` to avoid test interference.

---

## Issues I found

These are the main defects the framework exposed during test development and repeated live verification.

- The reset endpoint doesn't require authentication. Calling `POST /api/reset` succeeds without a bearer token, even though the API contract states that authentication is required.

- Duplicate IDs can be generated under concurrent requests. When multiple items are submitted at the same time (for example, three concurrent requests), the ID generation can collide. This could lead to problems when retrieving results or maintaining a reliable history.

- Confidence values can fall outside the valid range. During repeated runs of the golden dataset I observed confidence values both below 0 and above 1. This appears to be an API contract issue rather than an AI quality issue.

- The reset endpoint doesn't completely clear stored data. Although the history is removed previously generated results can still be retrieved using their IDs.

- Whitespace only input is accepted as valid. Instead of returning a validation error the API processes the request and returns a response with a null confidence value.

- Response field names are inconsistent across endpoints. For example one endpoint returns risk_flags while another returns riskFlags, making the API contract inconsistent for consumers.

---

## Expected model behavior

Some variation is expected and I did not treat it as a defect.

For example:

- confidence varies slightly because of random jitter
- “breaking” style inputs take longer to process
- semantically similar reasoning can receive partial credit instead of being treated as fully wrong

However, values outside 0-1 are not acceptable confidence variation. Those are treated as real defects.

---

## Evaluator

The evaluator scores each response across five areas:

- Label (35%)
- Risk flags (20%)
- Reasoning (20%)
- Confidence (15%)
- Category (10%)

Higher-risk examples have a larger effect on the final score.

Rather than comparing exact wording or exact confidence values, the evaluator:

- checks for expected and forbidden reasoning terms
- compares risk-flag overlap
- validates confidence against verdict-specific bands
- records hard failures for non-finite or out-of-range confidence

That makes it a better fit for a probabilistic system than strict exact-match assertions.

The current regression floor is **60**. That is intentionally lower than the narrative score band. It is there to catch real deterioration, not to claim that 60 means “good.”

---

## Stability

I ran the suite multiple times and saw golden scores stay around the mid-70s, including **75.00**, **75.44**, and **75.84** on recent verified runs.

That small movement is expected because confidence includes randomness and the classifier itself is not deterministic.

The default `npm run e2e` command is configured to skip Nx cache so the result reflects a fresh run rather than a replayed cached output.

---

## Limitations

There are a few limitations worth calling out.

- Golden dataset 19 does not actually exceed the API’s 2,000-character truncation boundary. The notes for that example suggest it should test what happens when an important disclaimer appears after the truncation cutoff, but the real input is only about 1,148 characters long. That means the example can still reveal a classification problem, but it cannot be used as evidence that the API mishandles truncation.
- Reasoning checks are keyword-based rather than truly semantic. The evaluator looks for expected and forbidden terms, which keeps the scoring transparent and easy to debug, but it also means a response can be logically correct and still lose some credit if it uses different wording or synonyms.
- The golden dataset contains only 20 examples, so it is useful for regression testing, not for measuring overall model accuracy.

---

## Out of scope

To keep the work focused, I did not cover:

- Firefox or WebKit
- mobile browsers
- visual regression testing
- load testing
- external source verification
- full accessibility audits

---

## AI usage

I used AI as a development assistant to understand the repository, generate first-pass test ideas, and speed up implementation. I did not use it as the source of truth.

Every finding included in this report was verified by reading the code, running the tests, or both.

The main artifact I actually used is [prompts/review-quality-findings.md]. The most useful outcome from that prompt was that it pushed me to verify the premise mechanically, which showed that the sample never crosses the truncation boundary it claims to test. I removed the stronger truncation claim and kept only the classification issue that the evidence supported.

---

## Reproducing the results

Environment:

- Node 20.20.0
- npm 10.8.2
- Playwright Chromium 148.0.7778.96

```bash
npm install
npm run e2e:init
npm run e2e
```

Latest verified fresh run:

- **16 tests passed**
- **18.2 seconds**
- **75.00/100** golden score
- **20** examples evaluated
- **4** confidence invariant violations

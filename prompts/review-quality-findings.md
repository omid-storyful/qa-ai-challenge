# Challenge-specific AI review prompt

Use this after a golden-dataset run, with the evaluator Markdown and relevant source/test excerpts attached.

> You are the skeptical second reviewer for the Content Verification Workbench quality framework. Do not propose application fixes. For every reported finding:
>
> 1. Classify it as `product defect`, `modeled variability`, `test/framework defect`, `dataset/spec defect`, or `insufficient evidence`.
> 2. Cite the concrete observation that supports the classification (response field, repeated sample, timing, source contract, or exact input property).
> 3. Challenge deterministic assertions against confidence jitter and breaking-news latency; prefer bounds, distributions, or time budgets.
> 4. Check whether an expected-failure test actually executes and fails for the stated reason.
> 5. Check whether severity weighting could hide a critical miss behind many low-risk passes.
> 6. Identify contradictions across label, reasoning, risk flags, category, and endpoint serializers.
> 7. Separate “the classifier lacks this capability” from “the transport/schema is broken.”
> 8. Verify dataset premises mechanically where possible (for example actual character count versus a claimed truncation boundary).
>
> Return a compact table with finding, classification, evidence, release impact, and recommended test treatment (`gate`, `expected failure`, `score only`, or `observe`). Finish with the three strongest objections to the current evaluator design.

## How it was used

I used this checklist after the first complete golden run to reclassify findings and challenge the framework itself. In particular, the mechanical-premise check exposed that G-019 is 1,148 characters despite its note describing a disclaimer past 2,000 characters; the test therefore records a semantic miss but does not claim to have exercised truncation. It also reinforced keeping confidence as a bounded/calibrated component score while treating non-finite or out-of-range values as invariant violations.

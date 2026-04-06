# AI-Powered Authentication Upgrade Plan

## Problem observed
Current `/management/authenticate` is primarily a manual, page-by-page checklist flow. It does not automatically compare uploaded item metadata/images against similar known items in your own catalogue before the authenticator decides.

## What we implemented now (phase 1)
1. **AI-assisted metadata pre-check** in the management authenticator UI.
   - Flags missing critical seller fields (brand, model, color, catalogue number, serial).
   - Warns on suspicious serial format.
2. **Auto-similarity matching against existing inventory**.
   - Ranks nearby items using weighted signals:
     - same brand
     - same designer
     - same model
     - same color
     - catalogue number match
     - serial match
     - shared title/details descriptors
   - Shows top matches with score + reasons.
3. **Persist AI findings** with the authentication record (`aiFindings`) for future audit/training.

## Recommended target architecture (phase 2+)

### A) Ingestion & normalization
- Require structured seller fields at listing time:
  - brand/designer, model, material, color, hardware finish, dimensions, catalogue/style code, serial/date code, country of manufacture.
- Add image-quality gate:
  - mandatory close-up macro shots (logo, serial/date code, stitching, hardware engraving).

### B) Retrieval + matching engine
- Build a two-stage candidate retrieval:
  1. **Metadata filter** (brand/category/model/color/catalogue constraints)
  2. **Visual embedding search** over reference images (vector DB)
- Combine into a unified authenticity risk score.

### C) Decisioning
- If confidence is very high and no contradictions, pre-fill checklist with suggested Pass/Fail signals.
- If confidence is medium/low, route to manual expert review with highlighted mismatch evidence.

### D) Continuous learning
- Train from resolved cases:
  - false positives/negatives
  - confirmed authentic/counterfeit
  - per-brand rule updates.

## Competitor/market patterns to copy

> These are the practical patterns seen across leading authentication ecosystems and marketplaces.

- **Entrupy** pattern: AI-assisted, image-driven analysis + certificate workflow.
- **Vestiaire Collective** pattern: combines human expertise with technology/authentication operations at scale.
- **Marketplace guarantee** pattern (e.g., authentication-guarantee models): centralized verification before buyer delivery for high-risk categories.

## Practical roadmap for MyFamousFinds

### Milestone 1 (0-2 weeks)
- Done in this patch:
  - AI pre-check + top-match suggestions in management UI.
  - Save AI findings to auth record.

### Milestone 2 (2-6 weeks)
- Add `/api/admin/authenticate/suggest/:id` service for server-side scoring.
- Add reference library per designer/model with approved authentic exemplars.
- Add stricter serial/catalogue pattern validators per brand.

### Milestone 3 (6-12 weeks)
- Add CV embeddings from mandatory close-up images.
- Add near-duplicate/counterfeit cluster detection.
- Introduce semi-automated approvals for low-risk matches.

### Milestone 4 (12+ weeks)
- Produce buyer-facing authenticity report with evidence snapshots:
  - matched reference examples
  - serial/date-code validation
  - material/hardware comparison highlights.

## KPIs to track
- Authentication cycle time per listing.
- Manual-review rate vs auto-assisted pass-through rate.
- Post-sale authenticity dispute rate.
- False positive / false negative rates from escalations.
- Revenue at risk prevented by counterfeit interception.

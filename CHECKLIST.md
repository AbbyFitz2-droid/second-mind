# OpenAI Build Week submission checklist

Deadline: **Tuesday, July 21, 2026 at 5:00 PM PDT**  
Málaga equivalent: **Wednesday, July 22 at 2:00 AM CEST**

Official category: **Apps for your life**

## Product readiness

- [x] Working capture-to-context prototype
- [x] Fictional sample data included
- [x] Zero-cost judge path works without an API key
- [x] Paid API calls disabled by default
- [x] Screenshot OCR runs locally
- [x] Missing dates remain unknown
- [x] Evidence provenance remains visible
- [x] Personal test data can be cleared
- [x] Automated test suite passes: 54/54
- [x] Team Abby full-pipeline evaluation passes: 28/28
- [x] README contains setup and run instructions
- [x] README explains architecture, models, privacy, and roadmap
- [x] Final pitch and under-three-minute demo script prepared
- [x] Narrated 148.6-second product-focused demonstration created and verified
- [x] Human-written English captions published and spelling verified
- [x] Repository contains no `.env` or API key
- [x] MIT licence included for public repository publication
- [x] Final source committed locally
- [x] Current Codex session ID recorded in `SUBMISSION_DETAILS.md`
- [x] Clean backup archive prepared

## Required manual submission steps

- [x] Join/register for the challenge on Devpost.
- [x] Choose **Apps for your life** as the category.
- [x] Record the demo using the 2-minute script in `SUBMISSION.md`.
- [x] Explicitly say how Codex **and GPT-5.6** were used.
- [x] Upload the demo as a **public YouTube video under three minutes**:
  https://youtu.be/n53Rs-6uDO4
- [x] Create or select the code repository URL for judging:
  `https://github.com/AbbyFitz2-droid/second-mind` (public).
- [x] If public, choose and add an appropriate open-source licence.
- [x] (N/A — public repository route selected, not private.)
- [x] Push this exact final source state to the submitted repository.
- [x] Run the repository setup once from a clean clone or clean folder.
  (Verified 2026-07-20: fresh `git clone`, install, 54/54 tests, 28/28 eval,
  full browser flow — see smoke test below.)
- [x] Get the `/feedback` Codex session ID for the task containing most of the
  core build.
- [x] Enter the recorded session ID in the submission form:
  `019f5bd7-32bc-77f0-8836-651fd258b040`.
- [x] Paste the project description and supporting copy from `SUBMISSION.md`.
- [x] Add the public YouTube URL and repository URL to the prepared submission
  details.
- [x] Add a cover image or product screenshot: `submission-assets/frames-v5/01-home.png`.
- [x] Preview every submitted link while signed out.
- [x] Submit before the deadline and save the confirmation page or email.
  **Submitted 2026-07-21 ~03:55 CEST** — see
  `submission-assets/devpost-submission-record.md`. Project page:
  https://devpost.com/software/second-mind-by-cognisyn

## Post-submission fixes

- [x] Fixed a crash: clicking **Add person** before any workspace existed
  (fresh visit or after clearing local data) threw an uncaught TypeError
  and silently failed. Now lazily starts a workspace first. Commit
  `021234d`. Re-verified from a clean clone: 54/54 tests, 28/28 evals.
- [x] Added **Live Reasoning**: the `/api/reason` endpoint (real GPT-5.6
  Responses API call, JSON schema, demo fallback) was fully implemented
  and tested but had no UI entry point — setting a live API key changed
  nothing visible. Added a standalone panel (5 lenses, freeform input,
  structured card output, live/demo source badge) so the live path is
  now directly demonstrable, not just documented. Commit `e6ed219`.
  Re-verified from a clean clone: 54/54 tests, 28/28 evals, direct
  `/api/reason` call confirmed working on the cloned server.

## Final five-minute smoke test

Completed 2026-07-20 from a clean clone (Node v24.14.0).

- [x] `npm install`
- [x] `cp .env.example .env`
- [x] `npm start`
- [x] Open `http://localhost:3000`
- [x] Choose **Share a screenshot**
- [x] Choose **Try a fictional screenshot**
- [x] Confirm OCR review shows Fran and leaves the date blank
- [x] File the capture
- [x] Open **View source**
- [x] Open **Action** and confirm both response panels render
- [x] Run `npm test` — 54/54 passed
- [x] Run `npm run eval` — 28/28 passed (100% intent, schema, isolation)

## Do not add before submission

- Continuous listening
- Production cloud storage
- Custom hardware
- More fictional scenarios
- A new visual design system
- Additional relationship scoring
- Unvalidated psychological or intent inference

## Repository route selected

The public repository route is complete:
https://github.com/AbbyFitz2-droid/second-mind

The repository contains an MIT licence and excludes personal `.env` files, API
keys, real screenshots, and real relationship data.

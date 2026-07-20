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
- [x] Narrated 124-second demonstration video created and verified
- [x] Repository contains no `.env` or API key
- [x] MIT licence included for public repository publication
- [x] Final source committed locally
- [x] Current Codex session ID recorded in `SUBMISSION_DETAILS.md`
- [x] Clean backup archive prepared

## Required manual submission steps

- [ ] Join/register for the challenge on Devpost.
- [ ] Choose **Apps for your life** as the category.
- [x] Record the demo using the 2-minute script in `SUBMISSION.md`.
- [x] Explicitly say how Codex **and GPT-5.6** were used.
- [ ] Upload the demo as a **public YouTube video under three minutes**.
- [ ] Create or select the code repository URL for judging.
- [x] If public, choose and add an appropriate open-source licence.
- [ ] If private, share repository access with:
  `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] Push this exact final source state to the submitted repository.
- [ ] Run the repository setup once from a clean clone or clean folder.
- [x] Get the `/feedback` Codex session ID for the task containing most of the
  core build.
- [ ] Enter the recorded session ID in the submission form.
- [ ] Paste the project description and supporting copy from `SUBMISSION.md`.
- [ ] Add the public YouTube URL and repository URL.
- [ ] Add a cover image or product screenshot if the form requests one.
- [ ] Preview every submitted link while signed out.
- [ ] Submit before the deadline and save the confirmation page or email.

## Final five-minute smoke test

- [ ] `npm install`
- [ ] `cp .env.example .env`
- [ ] `npm start`
- [ ] Open `http://localhost:3000`
- [ ] Choose **Share a screenshot**
- [ ] Choose **Try a fictional screenshot**
- [ ] Confirm OCR review shows Fran and leaves the date blank
- [ ] File the capture
- [ ] Open **View source**
- [ ] Open **Action** and confirm both response panels render
- [ ] Run `npm test`
- [ ] Run `npm run eval`

## Do not add before submission

- Continuous listening
- Production cloud storage
- Custom hardware
- More fictional scenarios
- A new visual design system
- Additional relationship scoring
- Unvalidated psychological or intent inference

## Manual decision still required

Choose one repository route:

1. **Public repository:** add a licence you deliberately select, then publish.
2. **Private repository:** keep the code private and grant access to both
   judging email addresses above.

Do not publish personal `.env` files, screenshots, API keys, or real relationship
data.

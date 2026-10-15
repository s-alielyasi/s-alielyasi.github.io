# Complete personal site refresh and add tested GitHub Pages delivery

The existing personal site uses outdated resume content, a fixed-height layout and incomplete search metadata. This update aligns the site with Ali Elyasi's product, software and quality focus and adds a repeatable path from pull-request checks to GitHub Pages deployment.

## Changes

- Organize static assets, replace the English resume with the supplied B2C PDF, remove the Persian resume and the requested contact/README links.
- Use official, locally hosted Vazir 30.1.0 Farsi-Digits webfonts with original OFL attribution.
- Apply the requested English title, Persian heading and exact description; synchronize canonical, Open Graph, JSON-LD, robots and sitemap metadata.
- Make all four sections usable on mobile, tablet and desktop, with native section links, keyboard access, visible focus, improved contrast and professional highlights based on the supplied resume.
- Add development documentation, public-repository ignore rules and MIT licensing for code/development docs, preserving separate font and personal-content rights.
- Add locked development dependencies, source validation, browser/accessibility tests, release verification and a whitelist-based static artifact.
- Run checks on PRs to `master`; deploy only from `master` after checks pass, with official actions pinned to commit SHAs and write permissions limited to the deployment job.
- Verify deployed HTML, metadata, assets, font and resume against the checked-out commit over HTTPS.

## Validation

- 48 browser tests passed without failures or retries on Chrome 155, Firefox 157 and WebKit 27.2, including Android/iPhone/iPad emulation, landscape layouts, keyboard traversal, enlarged text, JavaScript-disabled navigation and axe checks.
- 5 local HTTPS release-verification tests passed, covering current files, stale title/body/assets and refusal of plain HTTP.
- Native Firefox 136 browser zoom at 200% retained access to all sections and the final action without horizontal overflow.
- Source references, metadata consistency, release packaging, workflow structure and whitespace checks passed.
- Public external-link GET results and unresolved restrictions are recorded in `docs/link-checks.json` and `docs/status.md`.

Chromium projects used installed Google Chrome because the bundled browser download was geographically restricted. Device emulation and automated accessibility checks do not replace physical-device or manual screen-reader testing. These are local results; GitHub checks must also pass on this PR.

## Deployment

Set Settings → Pages → Source to **GitHub Actions**, retaining the existing `ali-elyasi.ir` domain and HTTPS settings. Merge into `master` after checks pass to trigger deployment. PR checks do not deploy the live site. See `docs/deployment.md` for release verification and troubleshooting.

The currently served site still has the old title; this PR's creation alone does not confirm that the new version is live. Search indexing and links that require account access need follow-up after deployment.

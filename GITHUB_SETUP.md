# GitHub Setup Notes

This folder can be published as a static GitHub Pages site.

## Recommended Files To Commit

- `index.html`
- `3Dmol-min.js`
- `1MBN.pdb`
- `README.md`
- `USER_GUIDE.md`
- `GITHUB_SETUP.md`
- `conservation_pipeline.py`

## One-Time Git Setup

After creating an empty GitHub repository, use its repository URL in place of `YOUR_REPOSITORY_URL`.

```bash
cd /Users/jackiefajardo/Documents/Codex/2026-06-20/co/outputs
git init
git add index.html 3Dmol-min.js 1MBN.pdb README.md USER_GUIDE.md GITHUB_SETUP.md conservation_pipeline.py
git commit -m "Initial Protein Structure and Chemistry Explorer"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## GitHub Pages

In GitHub:

1. Open the repository settings.
2. Go to Pages.
3. Set the source to deploy from the `main` branch.
4. Choose the repository root as the publishing folder.

After that, every push to `main` updates the public site automatically.

## Routine Updates

After Codex or the instructor edits the tool:

```bash
cd /Users/jackiefajardo/Documents/Codex/2026-06-20/co/outputs
git status
git add index.html README.md USER_GUIDE.md GITHUB_SETUP.md conservation_pipeline.py
git commit -m "Update explorer features"
git push
```

## What Codex Needs To Connect The Remote

Codex can initialize the git repository and add the remote after you provide:

- The GitHub repository URL.
- Confirmation that you are authenticated locally, or permission to use a token-based workflow.

Without the repository URL and authentication, Codex can prepare the files but cannot safely connect or push to GitHub.

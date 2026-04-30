# Push QuestionLiftIQ v0.5.1 to GitHub

Target repository:

```text
https://github.com/aleksandrsutkin-stack/Testing-App.git
```

The Git-ready ZIP is initialized as a Git repository with an initial v0.5.1 commit and the remote set to `origin`. The source-only ZIP is for browser upload and does not include `.git`.

Run:

```bash
cd Testing-App
git push -u origin main
```

If Git asks you to authenticate, sign in with GitHub or use a personal access token with repository write access.

If you unzip this into a folder without the `.git` directory, run this instead:

```bash
cd Testing-App
git init
git branch -M main
git add .
git commit -m "Add QuestionLiftIQ v0.5.1 app"
git remote add origin https://github.com/aleksandrsutkin-stack/Testing-App.git
git push -u origin main
```

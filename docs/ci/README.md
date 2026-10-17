# CI workflow waiting for the owner

`ci.yml` here is the GitHub Actions workflow for the app (types, lint, unit tests on every pull request and on main). It must live in `.github/workflows/ci.yml`, but the GitHub login that Claude uses on this computer has no `workflow` permission, so GitHub refuses the push. Giving that permission is a change to the login, so it is the owner's to approve.

To turn it on, the owner runs once in a terminal (opens a browser to approve):

```bash
gh auth refresh -s workflow
```

After that Claude moves the file to `.github/workflows/ci.yml` in a small PR.

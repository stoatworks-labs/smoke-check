# smoke-check

Serve a built static site, open it in headless Chromium, and **fail the job on any runtime error or an empty app root**.

This is the check a green build cannot give you. On 2026-08-11 a Dependabot PR bumped `react` to 19 and left `react-dom` on 18 in RFutils. It installed, typechecked, linted, tested and built — and the hosted site rendered nothing but its footer for three weeks, until an outside user reported it. A React major mismatch does not fail a build; it throws on first render. This catches that class.

```yaml
      - name: Build
        run: npm run build:static
      - name: Smoke-check the built site
        uses: stoatworks-labs/smoke-check@v1
        with:
          dir: packages/web/dist-static      # wherever index.html lands
```

| input | default | meaning |
|---|---|---|
| `dir` | — | directory containing the built `index.html` |
| `path` | `/` | URL path to load |
| `root` | `#root, #app, main` | selector for the app root that must render text |
| `min-text` | `20` | minimum characters of rendered text in the root |

It fails on: any `pageerror`, any `console.error`, any failed request, a navigation timeout, or a root with fewer than `min-text` characters. It prints every error it saw.

Pair it with `npm ls` in the same job: a `package.json` change with no `package-lock.json` change is a no-op under `npm ci`, and `npm ls` is what reports the resulting `invalid` dependency.

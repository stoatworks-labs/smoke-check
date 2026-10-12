# smoke-check

> **AI-assisted project.** This codebase was created with [Claude](https://claude.com/claude-code)
> (Anthropic), directed and reviewed by a human author.

A GitHub Action that serves your built static site, opens it in headless Chromium, and fails the job on any runtime error or an app root that comes up empty.

A build can pass every step and still ship a blank page. On 2026-08-11 a Dependabot PR in RFutils bumped `react` to 19 and left `react-dom` on 18. It installed, typechecked, linted, tested and built without a murmur, and the hosted site then showed nothing but its footer for three weeks, until a user from outside the project reported it. A mismatched React major builds perfectly happily and then throws on first render. This action catches that sort of thing.

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

It fails on any `pageerror`, any `console.error`, any failed request, a navigation timeout, or a root with fewer than `min-text` characters, and it prints every error it saw.

It's worth running `npm ls` in the same job as well. A `package.json` change with no matching `package-lock.json` change does nothing under `npm ci`, and `npm ls` is what tells you about the `invalid` dependency that leaves behind.

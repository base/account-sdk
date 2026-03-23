# @base-org/account-cli

Agent-first CLI for interacting with a user's Base Account.

## Development

### Prerequisites

```bash
# Build the SDK dependency (account-cli depends on @base-org/account)
yarn workspace @base-org/account build
```

### Build & Run

```bash
# Build the CLI
yarn workspace @base-org/account-cli build

# Run it
node packages/account-cli/dist/index.js --help
```

### Watch Mode

```bash
yarn workspace @base-org/account-cli dev
```

This runs `tsc --watch` — every save recompiles to `dist/`. Then run `node packages/account-cli/dist/index.js` to test.

### Tests

```bash
yarn workspace @base-org/account-cli test --run
```

### Typecheck & Lint

```bash
yarn workspace @base-org/account-cli typecheck
npx biome lint packages/account-cli/
```

## Architecture

Two layers with a hard boundary:

- **`commands/`** — CLI adapter. Parses flags with Commander, calls into `core/`, formats output. Only layer that touches `process`, stdin/stdout, or TTY.
- **`core/`** — Business logic. Zero CLI dependencies. Typed inputs → typed outputs. Reusable by a future MCP server.

### Adding a command

1. Create `src/core/<name>.ts` — pure function, typed inputs/outputs, no `process` or CLI deps
2. Create `src/commands/<name>.ts` — parse flags with Commander, call core, call `formatOutput`
3. Register in `src/index.ts`

`output/index.ts` provides `formatOutput` and `formatError`. `types/errors.ts` provides `CLIError` for structured error codes.

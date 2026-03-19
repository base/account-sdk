#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command()
  .name('base-account')
  .description("Interact with a user's Base Account")
  .version('0.1.0')
  .option('--json', 'Output JSON (default: human-readable text)', false);

program.parseAsync(process.argv);

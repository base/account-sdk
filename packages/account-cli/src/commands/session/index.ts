import { type Command, Option } from 'commander';
import {
  destroyAllSessions,
  destroySession,
  listSessions,
  resolveSession,
  sessionKey,
} from '../../core/session/index.js';
import { CLIError } from '../../types/errors.js';
import { SESSION_MODES, type SessionMode } from '../../types/session.js';
import { formatError, formatOutput } from '../../utils/index.js';

function sessionSummary(s: { mode: SessionMode } & Record<string, unknown>) {
  const base = { mode: s.mode, account: s.account };
  switch (s.mode) {
    case 'smart-wallet':
      return { ...base, sub_account: s.subAccount };
    case 'external-eoa':
      return { ...base, eoa: s.eoa };
    default:
      return base;
  }
}

export function registerSessionCommands(program: Command) {
  const session = program.command('session').description('Manage sessions');

  session
    .command('list')
    .description('List all sessions')
    .action((_opts, cmd) => {
      const globalOpts = cmd.parent!.parent!.opts();
      try {
        const sessions = listSessions();
        formatOutput({ sessions: sessions.map(sessionSummary) }, globalOpts.json);
      } catch (error) {
        formatError(error, globalOpts.json);
      }
    });

  session
    .command('info')
    .description('Show current resolved session')
    .action((_opts, cmd) => {
      const globalOpts = cmd.parent!.parent!.opts();
      try {
        const resolved = resolveSession();
        const base = {
          ...sessionSummary(resolved),
          resolved_via: resolved.resolvedVia,
        };

        if (resolved.mode === 'smart-wallet') {
          formatOutput(
            {
              ...base,
              ...(resolved.chainId ? { chain_id: resolved.chainId } : {}),
              signer: resolved.signer,
            },
            globalOpts.json
          );
        } else if (resolved.mode === 'external-eoa') {
          formatOutput(
            {
              ...base,
              ...(resolved.chainId ? { chain_id: resolved.chainId } : {}),
            },
            globalOpts.json
          );
        } else {
          formatOutput(base, globalOpts.json);
        }
      } catch (error) {
        formatError(error, globalOpts.json);
      }
    });

  session
    .command('destroy')
    .description('Delete a session')
    .argument('[identifier]', "The session's wallet address to destroy")
    .option('--all', 'Destroy all sessions')
    .addOption(new Option('--mode <mode>', 'Session mode').choices([...SESSION_MODES]))
    .action((identifier, opts, cmd) => {
      const globalOpts = cmd.parent!.parent!.opts();
      try {
        if (opts.all) {
          const destroyed = destroyAllSessions();
          formatOutput({ status: 'destroyed', sessions: destroyed }, globalOpts.json);
        } else if (identifier && opts.mode) {
          const mode = opts.mode as SessionMode;
          destroySession(mode, identifier);
          formatOutput({ status: 'destroyed', mode, identifier }, globalOpts.json);
        } else if (identifier) {
          const sessions = listSessions();
          const target = identifier.toLowerCase();
          const match = sessions.find((s) => sessionKey(s).toLowerCase() === target);
          if (!match) {
            throw new CLIError('INVALID_INPUT', `No session found for ${identifier}`);
          }
          destroySession(match.mode, identifier);
          formatOutput({ status: 'destroyed', mode: match.mode, identifier }, globalOpts.json);
        } else {
          throw new CLIError('INVALID_INPUT', 'Provide an address or use --all');
        }
      } catch (error) {
        formatError(error, globalOpts.json);
      }
    });
}

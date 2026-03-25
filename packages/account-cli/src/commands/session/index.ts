import { note, outro } from '@clack/prompts';
import { type Command, Option } from 'commander';
import {
  destroyAllSessions,
  destroySession,
  listSessions,
  resolveSession,
  resolveSessionInteractive,
  sessionKey,
} from '../../core/session/index.js';
import { CLIError } from '../../types/errors.js';
import { SESSION_MODES, type SessionMode } from '../../types/session.js';
import type { Session } from '../../types/session.js';
import { formatError, formatKeyValue, formatOutput, formatTable } from '../../utils/index.js';
import { promptSessionPicker } from '../../utils/prompt.js';

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

function sessionRow(s: Session): string[] {
  return [s.mode, sessionKey(s), s.account];
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
        if (globalOpts.json) {
          formatOutput({ sessions: sessions.map(sessionSummary) }, true);
        } else if (sessions.length === 0) {
          outro('No sessions found.');
        } else {
          const table = formatTable(['MODE', 'IDENTIFIER', 'ACCOUNT'], sessions.map(sessionRow));
          note(table, `${sessions.length} session${sessions.length === 1 ? '' : 's'}`);
        }
      } catch (error) {
        formatError(error, globalOpts.json);
      }
    });

  session
    .command('info')
    .description('Show current resolved session')
    .action(async (_opts, cmd) => {
      const globalOpts = cmd.parent!.parent!.opts();
      try {
        const resolved = globalOpts.json
          ? resolveSession()
          : await resolveSessionInteractive();

        if (globalOpts.json) {
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
              true
            );
          } else if (resolved.mode === 'external-eoa') {
            formatOutput(
              {
                ...base,
                ...(resolved.chainId ? { chain_id: resolved.chainId } : {}),
              },
              true
            );
          } else {
            formatOutput(base, true);
          }
        } else {
          const entries: [string, string][] = [
            ['Mode', resolved.mode],
            ['Account', resolved.account],
          ];
          if (resolved.mode === 'smart-wallet') {
            entries.push(['Sub-account', resolved.subAccount]);
          } else if (resolved.mode === 'external-eoa') {
            entries.push(['EOA', resolved.eoa]);
          }
          if ('chainId' in resolved && resolved.chainId) {
            entries.push(['Chain', resolved.chainId]);
          }
          if (resolved.mode === 'smart-wallet') {
            entries.push(['Signer', resolved.signer]);
          }
          entries.push(['Resolved via', resolved.resolvedVia]);

          note(formatKeyValue(entries), 'Session');
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
    .action(async (identifier, opts, cmd) => {
      const globalOpts = cmd.parent!.parent!.opts();
      try {
        if (opts.all) {
          const destroyed = destroyAllSessions();
          if (globalOpts.json) {
            formatOutput({ status: 'destroyed', sessions: destroyed }, true);
          } else {
            outro(`Destroyed ${destroyed.length} session${destroyed.length === 1 ? '' : 's'}.`);
          }
        } else if (identifier && opts.mode) {
          const mode = opts.mode as SessionMode;
          destroySession(mode, identifier);
          if (globalOpts.json) {
            formatOutput({ status: 'destroyed', mode, identifier }, true);
          } else {
            outro(`Destroyed ${mode} session: ${identifier}`);
          }
        } else if (identifier) {
          const sessions = listSessions();
          const target = identifier.toLowerCase();
          const match = sessions.find((s) => sessionKey(s).toLowerCase() === target);
          if (!match) {
            throw new CLIError('INVALID_INPUT', `No session found for ${identifier}`);
          }
          destroySession(match.mode, identifier);
          if (globalOpts.json) {
            formatOutput({ status: 'destroyed', mode: match.mode, identifier }, true);
          } else {
            outro(`Destroyed ${match.mode} session: ${identifier}`);
          }
        } else if (!globalOpts.json) {
          const sessions = listSessions();
          if (sessions.length === 0) {
            throw new CLIError('NO_SESSION', 'No sessions to destroy');
          }
          const selected = await promptSessionPicker(sessions);
          const key = sessionKey(selected);
          destroySession(selected.mode, key);
          outro(`Destroyed ${selected.mode} session: ${key}`);
        } else {
          throw new CLIError('INVALID_INPUT', 'Provide an address or use --all');
        }
      } catch (error) {
        formatError(error, globalOpts.json);
      }
    });
}

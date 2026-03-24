import { isCancel, select } from '@clack/prompts';
import { listSessions, resolveSession, sessionKey } from '../core/session/index.js';
import { CLIError } from '../types/errors.js';
import type { ResolvedSession, Session } from '../types/session.js';

type SessionRef = { session: Session };

export async function promptSessionPicker(sessions: Session[]): Promise<Session> {
  const selected = await select<SessionRef>({
    message: 'Multiple sessions found. Select one:',
    options: sessions.map((s) => ({
      value: { session: s },
      label: `${s.mode}  ${sessionKey(s)}`,
      hint: `account: ${s.account}`,
    })),
  });

  if (isCancel(selected)) {
    throw new CLIError('CANCELLED', 'Session selection cancelled');
  }

  return selected.session;
}

export async function resolveSessionInteractive(): Promise<ResolvedSession> {
  try {
    return resolveSession();
  } catch (error) {
    if (error instanceof CLIError && error.code === 'MULTIPLE_SESSIONS') {
      const sessions = listSessions();
      const selected = await promptSessionPicker(sessions);
      return { ...selected, resolvedVia: 'interactive' };
    }
    throw error;
  }
}

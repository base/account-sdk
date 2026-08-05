import { isCancel, select } from '@clack/prompts';
import { sessionKey } from '../core/session/index.js';
import { CLIError } from '../types/errors.js';
import type { Session } from '../types/session.js';

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

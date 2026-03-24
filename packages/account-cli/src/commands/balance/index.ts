import { note } from '@clack/prompts';
import type { Command } from 'commander';
import { isAddress } from 'viem';
import { resolveSession, sessionKey } from '../../core/session/index.js';
import { getBalance } from '../../core/balance/index.js';
import { chainDisplayName, parseChainId } from '../../utils/caip.js';
import { CLIError } from '../../types/errors.js';
import { formatError, formatKeyValue, formatOutput } from '../../utils/index.js';
import { resolveSessionInteractive } from '../../utils/prompt.js';

export function registerBalanceCommands(program: Command) {
  program
    .command('balance')
    .description('Fetch token balance for the current session address')
    .argument('[contract-address]', 'ERC-20 contract address (omit for native token)')
    .action(async (contractAddress: string | undefined, _opts, cmd) => {
      const globalOpts = cmd.parent!.opts();
      try {
        const session = globalOpts.json ? resolveSession() : await resolveSessionInteractive();
        const address = sessionKey(session) as `0x${string}`;

        if (!('chainId' in session) || !session.chainId) {
          throw new CLIError('NO_CHAIN', 'Session has no chain ID. Use a session with a chain.');
        }

        const parsed = parseChainId(session.chainId);
        if (!parsed) {
          throw new CLIError('INVALID_CHAIN', `Invalid CAIP-2 chain ID: ${session.chainId}`);
        }
        const numericChainId = Number(parsed.reference);

        let contract: `0x${string}` | undefined;
        if (contractAddress) {
          if (!isAddress(contractAddress)) {
            throw new CLIError('INVALID_INPUT', `Invalid contract address: ${contractAddress}`);
          }
          contract = contractAddress as `0x${string}`;
        }

        const result = await getBalance(address, numericChainId, contract);
        const chain = chainDisplayName(session.chainId);

        if (globalOpts.json) {
          formatOutput({
            address: result.address,
            chain,
            contract: result.contract,
            balance: result.balance,
          });
        } else {
          const entries: [string, string][] = [
            ['Address', result.address],
            ['Chain', chain],
            ['Contract', result.contract],
            ['Balance', result.balance],
          ];
          note(formatKeyValue(entries), 'Balance');
        }
      } catch (error) {
        formatError(error, globalOpts.json);
      }
    });
}

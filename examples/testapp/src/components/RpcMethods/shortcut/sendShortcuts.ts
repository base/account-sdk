import { ShortcutType } from './ShortcutType';
import { ADDR_TO_FILL } from './const';

const ethSendTransactionShortcuts: ShortcutType[] = [
  {
    key: 'Example Tx',
    data: {
      from: ADDR_TO_FILL,
      to: '0x0000000000000000000000000000000000000000',
      value: '0x0',
    },
  },
];

export const sendShortcutsMap = {
  eth_sendTransaction: ethSendTransactionShortcuts,
};

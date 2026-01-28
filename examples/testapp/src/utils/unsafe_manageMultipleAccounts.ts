import { generatePrivateKey } from 'viem/accounts';
import type { Hex } from 'viem';

const STORAGE_KEY = 'base-acc-sdk.demo.sub-accounts.pks';

export type StoredAccount = {
  id: string;
  privateKey: Hex;
  label?: string;
};

/**
 * Manage multiple private keys in local storage for testing sub accounts
 *
 * This is not safe, this is only for testing
 * In a real app you should not store/expose private keys
 */
export function unsafe_manageMultipleAccounts() {
  function getAll(): StoredAccount[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  function add(label?: string): StoredAccount {
    const accounts = getAll();
    const newAccount: StoredAccount = {
      id: crypto.randomUUID(),
      privateKey: generatePrivateKey(),
      label,
    };
    accounts.push(newAccount);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    return newAccount;
  }

  function remove(id: string): void {
    const accounts = getAll();
    const filtered = accounts.filter((acc) => acc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  function updateLabel(id: string, label: string): void {
    const accounts = getAll();
    const account = accounts.find((acc) => acc.id === id);
    if (account) {
      account.label = label;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  }

  function clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    getAll,
    add,
    remove,
    updateLabel,
    clear,
  };
}

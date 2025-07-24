declare global {
  interface Window {
    coinbaseWalletExtension?: any;
  }
}

// This empty export makes the file a "module", which is necessary for 'declare global' to work correctly.
export { };

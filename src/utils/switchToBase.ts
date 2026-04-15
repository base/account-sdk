/**
 * Requests MetaMask to switch network to Base Mainnet.
 */
export async function switchToBaseNetwork() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: "0x2105", // 8453
      chainName: "Base Mainnet",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"]
    }]
  });

  console.log("Switched to Base network ✅");
}

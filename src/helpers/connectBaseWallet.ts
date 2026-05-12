import { ethers } from "ethers";

/**
 * Connects MetaMask to the Base network and returns an ethers.js signer.
 */
export async function connectBaseWallet() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();

  // Base mainnet chain ID = 8453
  if (network.chainId !== 8453) {
    throw new Error(`Wrong network: ${network.chainId}. Please switch to Base Mainnet.`);
  }

  const signer = await provider.getSigner();
  console.log("Connected to Base as:", accounts[0]);
  return { provider, signer, address: accounts[0] };
}

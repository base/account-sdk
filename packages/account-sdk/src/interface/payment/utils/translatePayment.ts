import { encodeFunctionData, parseUnits, type Address, type Hex } from 'viem';
import { CHAIN_IDS, ERC20_TRANSFER_ABI, USDC_ADDRESS } from '../constants.js';

/**
 * Encodes an ERC20 transfer call
 * @param recipient - The recipient address
 * @param amount - The amount in USDC (will be converted to 6 decimals)
 * @returns The encoded function data
 */
export function encodeTransferCall(recipient: string, amount: string): Hex {
  // Parse amount to USDC decimals (6)
  const amountInUnits = parseUnits(amount, 6);

  // Encode the transfer function call
  return encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [recipient as Address, amountInUnits],
  });
}

/**
 * Builds the wallet_sendCalls request parameters
 * @param transferData - The encoded transfer call data
 * @param testnet - Whether to use testnet
 * @returns The request parameters for wallet_sendCalls
 */
export function buildSendCallsRequest(transferData: Hex, testnet: boolean) {
  const network = testnet ? 'baseSepolia' : 'base';
  const chainId = CHAIN_IDS[network];
  const usdcAddress = USDC_ADDRESS[network];

  // Build the call object
  const call = {
    to: usdcAddress as Address,
    data: transferData,
    value: '0x0' as Hex, // No ETH value for ERC20 transfer
  };

  // Build the request parameters
  const requestParams = {
    version: '1.0',
    chainId: chainId,
    calls: [call],
    capabilities: {},
  };

  return requestParams;
}

/**
 * Translates payment options into a wallet_sendCalls request
 * @param recipient - The recipient address
 * @param amount - The amount to send
 * @param testnet - Whether to use testnet
 * @returns The complete request parameters
 */
export function translatePaymentToSendCalls(recipient: string, amount: string, testnet: boolean) {
  // Encode the transfer call
  const transferData = encodeTransferCall(recipient, amount);

  // Build and return the sendCalls request
  return buildSendCallsRequest(transferData, testnet);
}

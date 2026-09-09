import { ethers } from "ethers";

import { FRIENDZONE_TOKEN_ABI } from "@/lib/web3/abi";
import { FZONE_ENTRY_FEE } from "@/lib/web3/addresses";
import { toUserFacingError } from "@/lib/web3/errors";

export function needsTokenApproval(allowance: bigint, required: bigint = FZONE_ENTRY_FEE): boolean {
  return allowance < required;
}

export function parseEtherAmount(value: string | null | undefined): bigint {
  if (!value) return 0n;
  try {
    return ethers.parseEther(value);
  } catch {
    return 0n;
  }
}

export function asTokenAmount(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === "string" && value.trim()) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

function tokenContract(runner: ethers.ContractRunner, tokenAddress: string): ethers.Contract {
  return new ethers.Contract(tokenAddress, FRIENDZONE_TOKEN_ABI, runner);
}

export async function readTokenBalance(runner: ethers.ContractRunner, tokenAddress: string, owner: string): Promise<bigint> {
  try {
    const value = await tokenContract(runner, tokenAddress).getFunction("balanceOf")(owner);
    return asTokenAmount(value);
  } catch (error) {
    throw toUserFacingError(error);
  }
}

export async function readTokenAllowance(
  runner: ethers.ContractRunner,
  tokenAddress: string,
  owner: string,
  spender: string,
): Promise<bigint> {
  try {
    const value = await tokenContract(runner, tokenAddress).getFunction("allowance")(owner, spender);
    return asTokenAmount(value);
  } catch (error) {
    throw toUserFacingError(error);
  }
}

export async function ensureTokenAllowance(options: {
  signer: ethers.Signer;
  tokenAddress: string;
  spender: string;
  amount?: bigint;
}): Promise<{ hash: string | null; alreadyApproved: boolean }> {
  const amount = options.amount ?? FZONE_ENTRY_FEE;
  try {
    const owner = await options.signer.getAddress();
    const current = await readTokenAllowance(options.signer, options.tokenAddress, owner, options.spender);
    if (!needsTokenApproval(current, amount)) {
      return { hash: null, alreadyApproved: true };
    }
    const tx = (await tokenContract(options.signer, options.tokenAddress).getFunction("approve")(
      options.spender,
      amount,
    )) as ethers.ContractTransactionResponse;
    const receipt = await tx.wait();
    return { hash: receipt?.hash ?? tx.hash, alreadyApproved: false };
  } catch (error) {
    throw toUserFacingError(error);
  }
}

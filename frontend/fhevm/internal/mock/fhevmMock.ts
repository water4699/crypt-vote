//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAY USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider } from "ethers";
import { FhevmInstance } from "../../fhevmTypes";

// Minimal fallback implementation when @fhevm/mock-utils is not available
const createMinimalLocalMockInstance = (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): FhevmInstance => {
  console.warn("[createMinimalLocalMockInstance] Using minimal fallback - FHE operations will not work");

  const provider = new JsonRpcProvider(parameters.rpcUrl);

  // Return a minimal FhevmInstance implementation
  return {
    // Minimal implementation - just enough to prevent crashes
    createEncryptedInput: (contractAddress: `0x${string}`, userAddress: `0x${string}`) => {
      const inputs: number[] = [];
      const inputObj = {
        add32: (value: number) => {
          inputs.push(value);
          return inputObj;
        },
        encrypt: async () => {
          // Generate proper 32-byte hex strings (64 hex chars + 0x prefix)
          const generateRandomBytes32 = () => {
            let result = '0x';
            for (let i = 0; i < 64; i++) {
              result += Math.floor(Math.random() * 16).toString(16);
            }
            return result as `0x${string}`;
          };

          return {
            handles: inputs.map(() => generateRandomBytes32()),
            inputProof: generateRandomBytes32()
          };
        }
      };
      return inputObj;
    },
    async encrypt8(value: number): Promise<`0x${string}`> {
      // Return a dummy encrypted handle
      return `0x${Math.random().toString(16).substring(2, 66)}` as `0x${string}`;
    },
    async encrypt16(value: number): Promise<`0x${string}`> {
      return `0x${Math.random().toString(16).substring(2, 66)}` as `0x${string}`;
    },
    async encrypt32(value: number): Promise<`0x${string}`> {
      return `0x${Math.random().toString(16).substring(2, 66)}` as `0x${string}`;
    },
    async decrypt(handle: `0x${string}`): Promise<number> {
      throw new Error("Decryption not supported in minimal fallback mode");
    },
    async reencrypt(
      handle: `0x${string}`,
      userAddress: `0x${string}`,
      signature: string
    ): Promise<string> {
      throw new Error("Reencryption not supported in minimal fallback mode");
    },
    async userDecrypt(
      handleContractPairs: Array<{ handle: `0x${string}`; contractAddress: `0x${string}` }>,
      privateKey: Uint8Array,
      signature: string,
      contractAddresses: `0x${string}`[]
    ): Promise<Record<`0x${string}`, number>> {
      // Mock implementation - return dummy decrypted values
      console.log("[userDecrypt] Mock decryption called", { handleContractPairs, contractAddresses });

      const result: Record<`0x${string}`, number> = {};
      handleContractPairs.forEach(({ handle }) => {
        // For mock purposes, extract a number from the handle (simulating decryption)
        // In a real implementation, this would decrypt the actual encrypted value
        const hash = handle.slice(2, 10); // Take first 8 chars after 0x
        const numValue = parseInt(hash, 16) % 10; // Convert to small number 0-9
        result[handle] = numValue;
      });

      return result;
    },
  } as unknown as FhevmInstance;
};

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  // Since @fhevm/mock-utils is removed from dependencies to fix production builds,
  // we always use the fallback implementation
  console.warn("[fhevmMockCreateInstance] Using minimal fallback - FHE operations will not work in production");
  return createMinimalLocalMockInstance(parameters);
};

import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "./useInMemoryStorage";
import { EncryptedVotingSystemABI } from "../abi/EncryptedVotingSystemABI";

export interface Vote {
  id: number;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  active: boolean;
  creator: string;
}

export interface VoteResult {
  voteId: number;
  optionId: number;
  count: number;
}

interface UseEncryptedVotingSystemState {
  contractAddress: string | undefined;
  votes: Vote[];
  currentVote: Vote | null;
  userVotes: Record<number, string>; // voteId -> encrypted handle
  decryptedResults: Record<number, VoteResult[]>; // voteId -> results
  decryptedUserVotes: Record<number, number>; // voteId -> decrypted vote option
  isLoading: boolean;
  message: string | undefined;
  createVote: (title: string, description: string, options: string[], durationDays: number) => Promise<number>;
  castVote: (voteId: number, optionId: number) => Promise<void>;
  decryptUserVote: (voteId: number) => Promise<number>;
  decryptVoteResults: (voteId: number) => Promise<VoteResult[]>;
  loadVotes: () => Promise<void>;
  refreshVote: (voteId: number) => Promise<void>;
}

export function useEncryptedVotingSystem(contractAddress: string | undefined): UseEncryptedVotingSystemState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentVote, setCurrentVote] = useState<Vote | null>(null);
  const [userVotes, setUserVotes] = useState<Record<number, string>>({});
  // Helper functions for localStorage persistence
  const getStorageKey = useCallback((suffix: string) => {
    if (!contractAddress || !address) return null;
    return `crypto-vote:${contractAddress}:${address}:${suffix}`;
  }, [contractAddress, address]);

  const loadDecryptedResultsFromStorage = useCallback((): Record<number, VoteResult[]> => {
    const key = getStorageKey("decryptedResults");
    if (!key || typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("[useEncryptedVotingSystem] Failed to load decrypted results from storage:", error);
    }
    return {};
  }, [getStorageKey]);

  const saveDecryptedResultsToStorage = useCallback((results: Record<number, VoteResult[]>) => {
    const key = getStorageKey("decryptedResults");
    if (!key || typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(results));
    } catch (error) {
      console.warn("[useEncryptedVotingSystem] Failed to save decrypted results to storage:", error);
    }
  }, [getStorageKey]);

  const loadDecryptedUserVotesFromStorage = useCallback((): Record<number, number> => {
    const key = getStorageKey("decryptedUserVotes");
    if (!key || typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("[useEncryptedVotingSystem] Failed to load decrypted user votes from storage:", error);
    }
    return {};
  }, [getStorageKey]);

  const saveDecryptedUserVotesToStorage = useCallback((userVotes: Record<number, number>) => {
    const key = getStorageKey("decryptedUserVotes");
    if (!key || typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(userVotes));
    } catch (error) {
      console.warn("[useEncryptedVotingSystem] Failed to save decrypted user votes to storage:", error);
    }
  }, [getStorageKey]);

  const [decryptedResults, setDecryptedResults] = useState<Record<number, VoteResult[]>>({});
  const [decryptedUserVotes, setDecryptedUserVotes] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  const createVote = useCallback(
    async (title: string, description: string, options: string[], durationDays: number): Promise<number> => {
      console.log("[useEncryptedVotingSystem] createVote called", {
        title,
        description,
        options,
        durationDays,
        contractAddress,
        hasEthersSigner: !!ethersSigner,
        address,
      });

      if (!contractAddress) {
        const error = new Error("Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
        setMessage(error.message);
        throw error;
      }

      if (!ethersSigner) {
        const error = new Error("Wallet signer not available. Please ensure your wallet is connected.");
        setMessage(error.message);
        throw error;
      }

      if (!address) {
        const error = new Error("Wallet address not available. Please connect your wallet.");
        setMessage(error.message);
        throw error;
      }

      if (!ethersProvider) {
        const error = new Error("Ethers provider not available.");
        setMessage(error.message);
        throw error;
      }

      if (options.length < 2) {
        const error = new Error("Must have at least 2 voting options");
        setMessage(error.message);
        throw error;
      }

      try {
        setIsLoading(true);
        setMessage("Creating voting...");

        // Verify contract is deployed
        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          const network = await ethersProvider.getNetwork();
          throw new Error(
            `Contract not deployed at ${contractAddress} on network ${network.name} (chainId: ${network.chainId}). ` +
            `Please deploy the contract first or switch to a network where the contract is deployed.`
          );
        }

        const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, ethersSigner);

        console.log("[useEncryptedVotingSystem] Creating vote with options:", options);

        const tx = await contract.createVote(title, description, options, durationDays, {
          gasLimit: 5000000,
        });
        console.log("[useEncryptedVotingSystem] Transaction sent:", tx.hash);

        setMessage("Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("[useEncryptedVotingSystem] Transaction confirmed, block:", receipt.blockNumber);

        // Extract voteId from logs
        const voteCreatedEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === 'VoteCreated';
          } catch {
            return false;
          }
        });

        let voteId: number;
        if (voteCreatedEvent) {
          const parsed = contract.interface.parseLog(voteCreatedEvent);
          if (parsed) {
            voteId = Number(parsed.args.voteId);
          } else {
            // Fallback: get next vote ID (should be current - 1)
            const nextId = await contract.getNextVoteId();
            voteId = Number(nextId) - 1;
          }
        } else {
          // Fallback: get next vote ID (should be current - 1)
          const nextId = await contract.getNextVoteId();
          voteId = Number(nextId) - 1;
        }

        setMessage(`Vote "${title}" created successfully with ID: ${voteId}`);

        // Refresh votes list
        await loadVotes();

        return voteId;
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error creating vote: ${errorMessage}`);
        console.error("[useEncryptedVotingSystem] Error creating vote:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, ethersProvider, address]
  );

  const castVote = useCallback(
    async (voteId: number, optionId: number) => {
      console.log("[useEncryptedVotingSystem] castVote called", {
        voteId,
        optionId,
        contractAddress,
        hasEthersSigner: !!ethersSigner,
        hasFhevmInstance: !!fhevmInstance,
        address,
      });

      if (!contractAddress) {
        const error = new Error("Contract address not configured");
        setMessage(error.message);
        throw error;
      }

      if (!ethersSigner) {
        const error = new Error("Wallet signer not available");
        setMessage(error.message);
        throw error;
      }

      if (!fhevmInstance) {
        const error = new Error("FHEVM instance not initialized");
        setMessage(error.message);
        throw error;
      }

      if (!address) {
        const error = new Error("Wallet address not available");
        setMessage(error.message);
        throw error;
      }

      if (!ethersProvider) {
        const error = new Error("Ethers provider not available");
        setMessage(error.message);
        throw error;
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting vote...");

        // Encrypt the option ID using FHEVM
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(optionId);
        const encrypted = await encryptedInput.encrypt();
        console.log("[useEncryptedVotingSystem] Encryption complete");

        setMessage("Submitting encrypted vote...");

        const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, ethersSigner);

        const encryptedOptionHandle = encrypted.handles[0];
        if (!encryptedOptionHandle || !encrypted.inputProof || encrypted.inputProof.length === 0) {
          throw new Error("Encryption failed - missing handle or proof");
        }

        console.log("[useEncryptedVotingSystem] Submitting vote transaction...");
        const tx = await contract.castVote(voteId, encryptedOptionHandle, encrypted.inputProof, {
          gasLimit: 5000000,
        });
        console.log("[useEncryptedVotingSystem] Vote transaction sent:", tx.hash);

        setMessage("Waiting for vote confirmation...");
        const receipt = await tx.wait();
        console.log("[useEncryptedVotingSystem] Vote confirmed, block:", receipt.blockNumber);

        setMessage("Vote cast successfully! Your vote has been encrypted and recorded.");

        // Update user votes
        setUserVotes(prev => ({
          ...prev,
          [voteId]: ethers.hexlify(encryptedOptionHandle)
        }));

        // Refresh vote data
        await refreshVote(voteId);

      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error casting vote: ${errorMessage}`);
        console.error("[useEncryptedVotingSystem] Error casting vote:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, ethersProvider, address]
  );

  const decryptUserVote = useCallback(
    async (voteId: number): Promise<number> => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        throw new Error("Missing requirements for decryption");
      }

      try {
        setMessage("Checking vote permissions...");

        // First, verify user has voted and get the encrypted vote
        const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, ethersProvider);
        const hasVoted = await contract.hasVotedInVote(voteId, address);

        if (!hasVoted) {
          throw new Error("You haven't voted in this vote yet");
        }

        // Request decryption from contract
        const requestId = Date.now();
        console.log("[useEncryptedVotingSystem] Requesting vote decryption for voteId:", voteId);

        // Get all encrypted votes (now allowed at any time)
        const encryptedVotes = await contract.getEncryptedVoteChoices(voteId);
        console.log("[useEncryptedVotingSystem] Got encrypted votes:", encryptedVotes);

        if (encryptedVotes.length === 0) {
          throw new Error("No encrypted votes found for this vote");
        }

        // Request decryption of vote results
        const signerContract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, ethersSigner);
        const tx = await signerContract.requestDecryptVoteResults(voteId, requestId);
        console.log("[useEncryptedVotingSystem] Decryption request sent:", tx.hash);

        setMessage("Waiting for decryption request confirmation...");
        const receipt = await tx.wait();
        console.log("[useEncryptedVotingSystem] Decryption request confirmed");

        setMessage("Decrypting voting results...");

        // Prepare handle-contract pairs for all encrypted votes
        const handleContractPairs = encryptedVotes.map((encryptedVote: any) => ({
          handle: ethers.hexlify(encryptedVote),
          contractAddress: contractAddress as `0x${string}`
        }));

        // Generate keypair for EIP712 signature
        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        // Sign the EIP712 message
        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        // For local mock network, remove "0x" prefix from signature
        const signatureForDecrypt = chainId === 31337
          ? signature.replace("0x", "")
          : signature;

        console.log("[useEncryptedVotingSystem] Decrypting with:", {
          handleCount: handleContractPairs.length,
          contractAddress,
          userAddress: address,
          chainId,
        });

        // Decrypt using userDecrypt method
        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        console.log("[useEncryptedVotingSystem] Decryption successful:", decryptedResult);

        // Process all decrypted votes to generate statistics
        const voteCounts: Record<number, number> = {};
        for (let i = 0; i < handleContractPairs.length; i++) {
          const handle = handleContractPairs[i].handle;
          const optionId = Number(decryptedResult[handle] || 0);
          voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
        }

        // Generate VoteResult array
        const results: VoteResult[] = Object.entries(voteCounts).map(([optionId, count]) => ({
          voteId,
          optionId: Number(optionId),
          count: Number(count)
        }));

        // Store results
        setDecryptedResults(prev => {
          const updated = {
            ...prev,
            [voteId]: results
          };
          // Persist to localStorage
          saveDecryptedResultsToStorage(updated);
          return updated;
        });

        // Extract user's vote from the decrypted results using the correct user vote handle
        const userVoteHandle = userVotes[voteId];
        if (userVoteHandle) {
          const decryptedVote = Number(decryptedResult[userVoteHandle] || 0);
          setDecryptedUserVotes(prev => {
            const updated = {
              ...prev,
              [voteId]: decryptedVote
            };
            // Persist to localStorage
            saveDecryptedUserVotesToStorage(updated);
            return updated;
          });
        } else {
          console.warn("[useEncryptedVotingSystem] No user vote handle found for voteId:", voteId);
        }

        setMessage(`Voting results decrypted successfully.`);

        // Return the decrypted user vote
        return userVoteHandle ? Number(decryptedResult[userVoteHandle] || 0) : 0;
      } catch (error: any) {
        console.error("[useEncryptedVotingSystem] Error decrypting vote:", error);
        const errorMessage = error.message || String(error);

        if (errorMessage.includes("not authorized") || errorMessage.includes("authorized")) {
          setMessage(`Decryption failed: You don't have permission to decrypt this vote. This may happen if the vote was from a different contract deployment.`);
        } else {
          setMessage(`Error decrypting vote: ${errorMessage}`);
        }
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId, userVotes, saveDecryptedResultsToStorage, saveDecryptedUserVotesToStorage]
  );

  const decryptVoteResults = useCallback(
    async (voteId: number): Promise<VoteResult[]> => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
      setMessage("Missing requirements for decryption");
        throw new Error("Missing requirements for decryption");
    }

    try {
        setMessage("Checking vote status...");

        const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, ethersProvider);

        // Check if voting has ended
        const voteData = await contract.getVote(voteId);
        if (voteData.active) {
          throw new Error("Cannot decrypt results while voting is still active");
        }

        // Request results decryption
        const requestId = Date.now();
        console.log("[useEncryptedVotingSystem] Requesting results decryption for voteId:", voteId);

        const tx = await contract.requestDecryptVoteResults(voteId, requestId);
        console.log("[useEncryptedVotingSystem] Results decryption request sent:", tx.hash);

        setMessage("Waiting for decryption request confirmation...");
        const receipt = await tx.wait();
        console.log("[useEncryptedVotingSystem] Results decryption request confirmed");

        // Get encrypted vote choices
        const encryptedVoteChoices = await contract.getEncryptedVoteChoices(voteId);

        setMessage("Decrypting voting results...");

        const results: VoteResult[] = [];
        const handleContractPairs = [];

        // Process each encrypted vote choice
        for (let i = 0; i < encryptedVoteChoices.length; i++) {
          const handle = ethers.hexlify(encryptedVoteChoices[i]);
          handleContractPairs.push({
            handle,
            contractAddress: contractAddress as `0x${string}`
          });
        }

        if (handleContractPairs.length === 0) {
          // No votes cast yet
          setMessage("No votes have been cast in this vote yet");
          setDecryptedResults(prev => {
            const updated = {
              ...prev,
              [voteId]: []
            };
            saveDecryptedResultsToStorage(updated);
            return updated;
          });
          return [];
        }

      // Generate keypair for EIP712 signature
      let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
      } else {
        keypair = {
          publicKey: new Uint8Array(32).fill(0),
          privateKey: new Uint8Array(32).fill(0),
        };
      }

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";

      let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimestamp,
          durationDays
        );
      } else {
        eip712 = {
          domain: {
            name: "FHEVM",
            version: "1",
            chainId: chainId,
            verifyingContract: contractAddresses[0],
          },
          types: {
            UserDecryptRequestVerification: [
              { name: "publicKey", type: "bytes" },
              { name: "contractAddresses", type: "address[]" },
              { name: "startTimestamp", type: "string" },
              { name: "durationDays", type: "string" },
            ],
          },
          message: {
            publicKey: ethers.hexlify(keypair.publicKey),
            contractAddresses,
            startTimestamp,
            durationDays,
          },
        };
      }

      // Sign the EIP712 message
      const signature = await ethersSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

        // For local mock network, remove "0x" prefix from signature
      const signatureForDecrypt = chainId === 31337
        ? signature.replace("0x", "")
        : signature;

        console.log("[useEncryptedVotingSystem] Decrypting results with:", {
          handleCount: handleContractPairs.length,
          contractAddress,
          chainId,
        });

        // Decrypt using userDecrypt method
        const decryptedResults = await (fhevmInstance as any).userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        // Count votes by option
        const voteCounts: Record<number, number> = {};
        for (let i = 0; i < handleContractPairs.length; i++) {
          const handle = handleContractPairs[i].handle;
          const optionId = Number(decryptedResults[handle] || 0);
          voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
        }

        // Convert to VoteResult array
        Object.entries(voteCounts).forEach(([optionId, count]) => {
          results.push({
            voteId,
            optionId: parseInt(optionId),
            count
          });
        });

        console.log("[useEncryptedVotingSystem] Results decryption successful:", results);
        setMessage(`Voting results decrypted successfully`);

        // Store decrypted results
        setDecryptedResults(prev => {
          const updated = {
            ...prev,
            [voteId]: results
          };
          // Persist to localStorage
          saveDecryptedResultsToStorage(updated);
          return updated;
        });

        return results;
      } catch (error: any) {
        console.error("[useEncryptedVotingSystem] Error decrypting results:", error);
        const errorMessage = error.message || String(error);

        if (errorMessage.includes("not authorized") || errorMessage.includes("authorized")) {
          setMessage(`Decryption failed: You don't have permission to decrypt these results.`);
        } else {
          setMessage(`Error decrypting results: ${errorMessage}`);
        }
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId, saveDecryptedResultsToStorage]
  );

  const loadVotes = useCallback(async () => {
    if (!contractAddress) {
      return;
    }

    try {
      setIsLoading(true);

      // Create a provider - use ethersProvider if available, otherwise create one
      let provider = ethersProvider;
      if (!provider) {
        // Create a new provider based on chainId
        if (chainId === 31337) {
          provider = new ethers.JsonRpcProvider("http://localhost:8545");
        } else {
          // For other networks, we need the walletClient
          if (!walletClient) {
            console.log("[useEncryptedVotingSystem] No provider or walletClient available, skipping loadVotes");
            return;
          }
          provider = new ethers.BrowserProvider(walletClient as any) as any;
        }
      }

      // Check if we can connect to the provider first
      try {
        await provider.getBlockNumber();
      } catch (providerError: any) {
        if (chainId === 31337) {
          const errorMsg = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
          setMessage(errorMsg);
          return;
        } else {
          throw providerError;
        }
      }

      const contractCode = await provider.getCode(contractAddress);
      if (contractCode === "0x" || contractCode.length <= 2) {
        setMessage(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        return;
      }

      const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, provider);

      // Get next vote ID to know how many votes exist
      const nextVoteId = await contract.getNextVoteId();
      const voteCount = Number(nextVoteId);

      const loadedVotes: Vote[] = [];

      // Load all votes
      for (let i = 1; i < voteCount; i++) {
        try {
          const voteData = await contract.getVote(i);
          const vote: Vote = {
            id: i,
            title: voteData.title,
            description: voteData.description,
            options: voteData.options,
            startTime: Number(voteData.startTime),
            endTime: Number(voteData.endTime),
            active: voteData.active,
            creator: voteData.creator
          };
          loadedVotes.push(vote);
        } catch (error) {
          // Vote might not exist, continue
          console.warn(`Failed to load vote ${i}:`, error);
        }
      }

      setVotes(loadedVotes);
      
      // Load user's voting status for all votes
      if (address) {
        const userVotesMap: Record<number, string> = {};
        for (const vote of loadedVotes) {
          try {
            const hasVoted = await contract.hasVotedInVote(vote.id, address);
            if (hasVoted) {
              try {
                // Get the user's encrypted vote handle
                // Note: In a real implementation, we'd need a method to get the specific user's vote
                // For now, we'll use a placeholder to indicate the user has voted
                const encryptedVotes = await contract.getEncryptedVoteChoices(vote.id);
                if (encryptedVotes.length > 0) {
                  // Store a marker that user has voted (we'll use the first encrypted vote as a placeholder)
                  // In production, we'd need to track which encrypted vote belongs to which user
                  userVotesMap[vote.id] = ethers.hexlify(encryptedVotes[0]);
                } else {
                  // User has voted but we can't get the handle, use a placeholder
                  userVotesMap[vote.id] = "0x1"; // Placeholder to indicate user has voted
                }
              } catch (error) {
                // If we can't get encrypted votes, still mark that user has voted
                userVotesMap[vote.id] = "0x1"; // Placeholder
                console.warn(`[useEncryptedVotingSystem] Could not get encrypted vote for vote ${vote.id}:`, error);
              }
            }
          } catch (error) {
            console.warn(`[useEncryptedVotingSystem] Could not check voting status for vote ${vote.id}:`, error);
          }
        }
        // Update userVotes state, preserving existing entries
        setUserVotes(prev => ({ ...prev, ...userVotesMap }));
      }
      
      setMessage(`Loaded ${loadedVotes.length} votes`);
    } catch (error: any) {
      console.error("[useEncryptedVotingSystem] Error loading votes:", error);
      let errorMessage = error.message || String(error);

      if (error.code === "UNKNOWN_ERROR" || error.code === -32603) {
        if (chainId === 31337) {
          errorMessage = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
      } else {
          errorMessage = `Network error: ${error.message || "Failed to connect to blockchain"}`;
        }
      }

      setMessage(`Error loading votes: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ethersProvider, chainId, address, walletClient]);

  const refreshVote = useCallback(async (voteId: number) => {
    if (!contractAddress || !address) {
      return;
    }

    try {
      // Create a provider - use ethersProvider if available, otherwise create one
      let provider = ethersProvider;
      if (!provider) {
        if (chainId === 31337) {
          provider = new ethers.JsonRpcProvider("http://localhost:8545");
        } else if (walletClient) {
          provider = new ethers.BrowserProvider(walletClient as any) as any;
        } else {
          console.log("[useEncryptedVotingSystem] No provider available for refreshVote");
          return;
        }
      }

      const contract = new ethers.Contract(contractAddress, EncryptedVotingSystemABI, provider);

      // Reload specific vote
      const voteData = await contract.getVote(voteId);
      const updatedVote: Vote = {
        id: voteId,
        title: voteData.title,
        description: voteData.description,
        options: voteData.options,
        startTime: Number(voteData.startTime),
        endTime: Number(voteData.endTime),
        active: voteData.active,
        creator: voteData.creator
      };

      setVotes(prev => prev.map(vote => vote.id === voteId ? updatedVote : vote));

      // Check if user has voted and update userVotes
      const hasVoted = await contract.hasVotedInVote(voteId, address);
      if (hasVoted) {
        try {
          const encryptedVotes = await contract.getEncryptedVoteChoices(voteId);
          if (encryptedVotes.length > 0) {
            // For now, just use the first encrypted vote as the user's vote
            // In a real implementation, we'd need to track which vote belongs to which user
            const handle = ethers.hexlify(encryptedVotes[0]);
            setUserVotes(prev => ({
              ...prev,
              [voteId]: handle
            }));
          } else {
            // User has voted but we can't get the handle, use a placeholder
            setUserVotes(prev => ({
              ...prev,
              [voteId]: "0x1" // Placeholder to indicate user has voted
            }));
          }
        } catch (error) {
          // If we can't get encrypted votes, still mark that user has voted
          setUserVotes(prev => ({
            ...prev,
            [voteId]: "0x1" // Placeholder
          }));
          console.warn(`[useEncryptedVotingSystem] Could not get encrypted votes for vote ${voteId}:`, error);
        }
      } else {
        // User hasn't voted, remove from userVotes if present
        setUserVotes(prev => {
          const updated = { ...prev };
          delete updated[voteId];
          return updated;
        });
      }
    } catch (error) {
      console.error(`[useEncryptedVotingSystem] Error refreshing vote ${voteId}:`, error);
    }
  }, [contractAddress, ethersProvider, address, chainId, walletClient]);

  // Load decrypted results from localStorage on mount or when address/contract changes
  useEffect(() => {
    if (contractAddress && address) {
      const storedResults = loadDecryptedResultsFromStorage();
      const storedUserVotes = loadDecryptedUserVotesFromStorage();
      
      if (Object.keys(storedResults).length > 0) {
        setDecryptedResults(storedResults);
      }
      
      if (Object.keys(storedUserVotes).length > 0) {
        setDecryptedUserVotes(storedUserVotes);
      }
    } else {
      // Clear decrypted results if address or contract changes
      setDecryptedResults({});
      setDecryptedUserVotes({});
    }
  }, [contractAddress, address, loadDecryptedResultsFromStorage, loadDecryptedUserVotesFromStorage]);

  useEffect(() => {
    if (contractAddress && ethersProvider && address) {
      loadVotes();
    }
  }, [contractAddress, ethersProvider, address, loadVotes]);

  return {
    contractAddress,
    votes,
    currentVote,
    userVotes,
    decryptedResults,
    decryptedUserVotes,
    isLoading,
    message,
    createVote,
    castVote,
    decryptUserVote,
    decryptVoteResults,
    loadVotes,
    refreshVote,
  };
}
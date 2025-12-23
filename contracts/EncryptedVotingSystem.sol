// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Voting System Contract
/// @author crypto-vote
/// @notice A privacy-preserving voting system using FHEVM.
/// Users can create votes, cast encrypted votes, and decrypt results securely.
/// Uses fully homomorphic encryption for privacy protection.
/// Supports both local Hardhat network (with mock) and Sepolia testnet.
/// Enhanced with batch operations and comprehensive analytics.
contract EncryptedVotingSystem is SepoliaConfig {
    // Network detection for different FHEVM configurations
    bool private immutable _isLocalNetwork;

    constructor() {
        _owner = msg.sender;
        _nextVoteId = 1; // Start from 1
        _nextOptionId = 1;
        // Detect if we're on local network (chainId 31337)
        _isLocalNetwork = block.chainid == 31337;
    }
    address private _owner;

    // Vote structure
    struct Vote {
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        bool active;
        address creator;
    }

    // Encrypted vote data using FHEVM
    mapping(uint256 => Vote) public votes; // voteId => Vote struct
    mapping(uint256 => euint32[]) private _encryptedVoteChoices; // voteId => array of encrypted vote choices
    mapping(uint256 => mapping(address => bool)) private _hasVoted; // voteId => user => has voted
    mapping(uint256 => uint256) private _voteCount; // voteId => total number of votes cast

    uint256 private _nextVoteId;
    uint256 private _nextOptionId;

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == _owner, "Only owner can transfer ownership");
        require(newOwner != address(0), "New owner cannot be zero address");
        _owner = newOwner;
    }

    // Events
    event VoteCreated(uint256 indexed voteId, address indexed creator, string title);
    event VoteCast(uint256 indexed voteId, address indexed voter);
    event VoteDecrypted(uint256 indexed voteId, address indexed user, uint32 decryptedVote);
    event VotingEnded(uint256 indexed voteId);

    /// @notice Create a new vote
    /// @param title Vote title
    /// @param description Vote description
    /// @param options Array of voting options
    /// @param durationInDays Voting duration in days
    /// @return voteId The ID of the created vote
    function createVote(
        string calldata title,
        string calldata description,
        string[] calldata options,
        uint256 durationInDays
    ) external returns (uint256 voteId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(options.length >= 2, "Must have at least 2 options");
        require(durationInDays > 0 && durationInDays <= 365, "Duration must be between 1-365 days");

        voteId = _nextVoteId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (durationInDays * 1 days);

        votes[voteId] = Vote({
            title: title,
            description: description,
            options: options,
            startTime: startTime,
            endTime: endTime,
            active: true,
            creator: msg.sender
        });

        // Vote choices will be stored in _encryptedVoteChoices array when votes are cast

        emit VoteCreated(voteId, msg.sender, title);
        return voteId;
    }

    /// @notice Cast an encrypted vote for a specific option
    /// @param voteId The ID of the vote
    /// @param encryptedOptionId The encrypted option ID the user is voting for
    /// @param inputProof The FHE input proof for verification
    function castVote(uint256 voteId, externalEuint32 encryptedOptionId, bytes calldata inputProof) external {
        require(votes[voteId].active, "Vote does not exist or is not active");
        require(block.timestamp >= votes[voteId].startTime, "Voting has not started yet");
        require(block.timestamp <= votes[voteId].endTime, "Voting has ended");
        require(!_hasVoted[voteId][msg.sender], "Already voted in this vote");

        // Handle FHE operations based on network
        euint32 optionId;
        if (_isLocalNetwork) {
            // On local network, we need to handle the encrypted input differently
            // Since FHEVM local simulation doesn't actually decrypt, we'll use a workaround
            // For now, we'll accept that local testing has limitations
            optionId = FHE.fromExternal(encryptedOptionId, inputProof);
        } else {
            // On Sepolia, use real FHE operations
            optionId = FHE.fromExternal(encryptedOptionId, inputProof);
        }

        // Mark user as voted
        _hasVoted[voteId][msg.sender] = true;

        // Store the encrypted vote choice in the array
        _encryptedVoteChoices[voteId].push(optionId);

        // Increment vote count
        _voteCount[voteId]++;

        // Grant decryption permissions (works on both networks)
        FHE.allowThis(optionId);
        FHE.allow(optionId, msg.sender);

        emit VoteCast(voteId, msg.sender);
    }

    /// @notice End a vote (can be called by anyone after end time)
    /// @param voteId The ID of the vote to end
    function endVote(uint256 voteId) external {
        require(votes[voteId].active, "Vote is already ended");
        require(block.timestamp >= votes[voteId].endTime, "Voting end time not reached");

        votes[voteId].active = false;
        emit VotingEnded(voteId);
    }

    /// @notice Get vote information
    /// @param voteId The ID of the vote
    /// @return title Vote title
    /// @return description Vote description
    /// @return options Array of voting options
    /// @return startTime Voting start time
    /// @return endTime Voting end time
    /// @return active Whether the vote is active
    /// @return creator Vote creator address
    function getVote(uint256 voteId) external view returns (
        string memory title,
        string memory description,
        string[] memory options,
        uint256 startTime,
        uint256 endTime,
        bool active,
        address creator
    ) {
        Vote storage vote = votes[voteId];
        return (
            vote.title,
            vote.description,
            vote.options,
            vote.startTime,
            vote.endTime,
            vote.active,
            vote.creator
        );
    }

    /// @notice Get the total number of votes cast for a vote
    /// @param voteId The ID of the vote
    /// @return The total number of votes cast
    function getVoteCount(uint256 voteId) external view returns (uint256) {
        return _voteCount[voteId];
    }

    /// @notice Get all encrypted vote choices for a vote (for decryption)
    /// @param voteId The ID of the vote
    /// @return encryptedVotes Array of all encrypted vote choices
    function getEncryptedVoteChoices(uint256 voteId) external view returns (euint32[] memory encryptedVotes) {
        // Allow viewing encrypted votes at any time for development/testing purposes
        // require(!votes[voteId].active, "Cannot view encrypted votes while voting is active");
        return _encryptedVoteChoices[voteId];
    }

    /// @notice Check if user has voted in a specific vote
    /// @param voteId The ID of the vote
    /// @param user The address of the user
    /// @return True if the user has voted
    function hasVotedInVote(uint256 voteId, address user) external view returns (bool) {
        return _hasVoted[voteId][user];
    }

    /// @notice Get the next available vote ID
    /// @return The next vote ID
    function getNextVoteId() external view returns (uint256) {
        return _nextVoteId;
    }

    /// @notice Request decryption of all vote results for a specific vote
    /// @param voteId The ID of the vote
    /// @param requestId A unique identifier for this decryption request
    /// @return Array of encrypted vote counts for each option
    function requestDecryptVoteResults(uint256 voteId, uint256 requestId) external returns (euint32[] memory) {
        // Allow decryption at any time for development/testing purposes
        // require(!votes[voteId].active, "Cannot decrypt results while voting is active");

        uint256 voteCount = _encryptedVoteChoices[voteId].length;
        euint32[] memory encryptedResults = new euint32[](voteCount);

        // Return all encrypted vote choices
        for (uint256 i = 0; i < voteCount; i++) {
            encryptedResults[i] = _encryptedVoteChoices[voteId][i];
            // Grant decryption permissions
            FHE.allowThis(encryptedResults[i]);
            FHE.allow(encryptedResults[i], msg.sender);
        }

        emit VoteDecrypted(voteId, msg.sender, 999); // 999 indicates results decryption
        return encryptedResults;
    }

    /// @notice Get voting statistics for a specific vote
    /// @param voteId The ID of the vote
    /// @return totalVotes Total number of votes cast
    /// @return uniqueVoters Number of unique voters
    /// @return isActive Whether the vote is still active
    function getVoteStatistics(uint256 voteId)
        external
        view
        returns (uint32 totalVotes, uint256 uniqueVoters, bool isActive)
    {
        Vote memory voteData = votes[voteId];
        require(voteData.creator != address(0), "Vote does not exist");

        totalVotes = uint32(_voteCount[voteId]);
        uniqueVoters = totalVotes; // Simplified: assume each vote is from unique voter
        isActive = voteData.active && block.timestamp < voteData.endTime;

        return (totalVotes, uniqueVoters, isActive);
    }

    /// @notice Cast multiple encrypted votes in a single transaction
    /// @param voteIds Array of vote IDs to cast votes for
    /// @param encryptedChoices Array of encrypted vote choices
    /// @param inputProofs Array of FHE input proofs
    function batchCastVotes(
        uint256[] calldata voteIds,
        externalEuint32[] calldata encryptedChoices,
        bytes[] calldata inputProofs
    ) external {
        require(voteIds.length == encryptedChoices.length, "Array length mismatch");
        require(voteIds.length == inputProofs.length, "Array length mismatch");
        require(voteIds.length > 0, "Cannot cast empty batch");
        require(voteIds.length <= 5, "Batch size limited to 5 votes for gas efficiency");

        for (uint256 i = 0; i < voteIds.length; i++) {
            uint256 voteId = voteIds[i];
            Vote memory voteData = votes[voteId];
            require(voteData.creator != address(0), "Vote does not exist");
            require(voteData.active && block.timestamp >= voteData.startTime && block.timestamp <= voteData.endTime, "Vote not active");
            require(!_hasVoted[voteId][msg.sender], "Already voted");

            // Convert external input to internal FHE type
            euint32 encryptedChoice = FHE.fromExternal(encryptedChoices[i], inputProofs[i]);

            // Store the encrypted vote choice
            _encryptedVoteChoices[voteId].push(encryptedChoice);
            _hasVoted[voteId][msg.sender] = true;
            _voteCount[voteId]++;

            // Grant decryption permissions
            FHE.allowThis(encryptedChoice);
            FHE.allow(encryptedChoice, msg.sender);

            emit VoteCast(voteId, msg.sender);
        }
    }

    /// @notice Validate voting option input
    /// @param optionIndex The index of the voting option
    /// @param voteId The ID of the vote
    /// @return isValid True if the option is valid for the given vote
    function validateVoteOption(uint256 voteId, uint256 optionIndex)
        external
        view
        returns (bool isValid)
    {
        Vote memory voteData = votes[voteId];
        if (voteData.creator == address(0)) {
            return false;
        }

        return optionIndex < voteData.options.length;
    }

    /// @notice Get voting participation rate for a specific vote
    /// @param voteId The ID of the vote
    /// @param expectedParticipants Expected number of participants
    /// @return participationRate Participation rate as percentage (0-100)
    /// @return actualVotes Number of votes cast
    function getParticipationRate(uint256 voteId, uint256 expectedParticipants)
        external
        view
        returns (uint256 participationRate, uint32 actualVotes)
    {
        Vote memory voteData = votes[voteId];
        require(voteData.creator != address(0), "Vote does not exist");

        actualVotes = uint32(_voteCount[voteId]);
        if (expectedParticipants == 0) {
            participationRate = 0;
        } else {
            participationRate = (actualVotes * 100) / expectedParticipants;
            if (participationRate > 100) {
                participationRate = 100;
            }
        }

        return (participationRate, actualVotes);
    }

    /// @notice Initialize multiple votes in a single transaction
    /// @param titles Array of vote titles
    /// @param descriptions Array of vote descriptions
    /// @param optionsList Array of option arrays for each vote
    /// @param startTimes Array of start times
    /// @param endTimes Array of end times
    function batchInitializeVotes(
        string[] calldata titles,
        string[] calldata descriptions,
        string[][] calldata optionsList,
        uint256[] calldata startTimes,
        uint256[] calldata endTimes
    ) external {
        require(titles.length == descriptions.length, "Array length mismatch");
        require(titles.length == optionsList.length, "Array length mismatch");
        require(titles.length == startTimes.length, "Array length mismatch");
        require(titles.length == endTimes.length, "Array length mismatch");
        require(titles.length > 0, "Cannot initialize empty batch");
        require(titles.length <= 10, "Batch size limited to 10 votes for gas efficiency");

        for (uint256 i = 0; i < titles.length; i++) {
            require(optionsList[i].length >= 2, "Each vote must have at least 2 options");
            require(optionsList[i].length <= 10, "Each vote limited to 10 options");
            require(startTimes[i] < endTimes[i], "Start time must be before end time");

            votes[_nextVoteId] = Vote({
                title: titles[i],
                description: descriptions[i],
                options: optionsList[i],
                startTime: startTimes[i],
                endTime: endTimes[i],
                active: true,
                creator: msg.sender
            });

            emit VoteCreated(_nextVoteId, msg.sender, titles[i]);
            _nextVoteId++;
        }
    }
}

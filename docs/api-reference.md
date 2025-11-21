# Crypto Vote Voting System - API Reference

## Smart Contract Functions

### Core Functions

#### `initializeVoting(string[] options)`
Initialize a new vote with specified options.
- **Parameters:**
  - `options`: Array of voting option descriptions
- **Events:** `VoteCreated`

#### `castVote(uint256 optionIndex, bytes inputProof)`
Cast an encrypted vote for a specific option.
- **Parameters:**
  - `optionIndex`: Index of the chosen option
  - `inputProof`: FHE input proof

#### `batchCastVotes(uint256[] voteIds, externalEuint32[] encryptedChoices, bytes[] inputProofs)`
Cast multiple encrypted votes in a single transaction.
- **Parameters:**
  - `voteIds`: Array of vote IDs
  - `encryptedChoices`: Array of encrypted vote choices
  - `inputProofs`: Array of FHE input proofs

### Analytics Functions

#### `getVoteStatistics(uint256 voteId)`
Get comprehensive statistics for a specific vote.
- **Returns:** `(totalVotes, uniqueVoters, isActive)`

#### `getParticipationRate(uint256 voteId, uint256 expectedParticipants)`
Calculate participation rate for a vote.
- **Returns:** `(participationRate, actualVotes)`

#### `getTotalVotes()`
Get total number of votes cast.
- **Returns:** Total vote count

### Utility Functions

#### `validateVoteOption(uint256 voteId, uint256 optionIndex)`
Validate if an option index is valid for a vote.
- **Returns:** Boolean indicating validity

#### `getNextVoteId()`
Get the next available vote ID.
- **Returns:** Next vote ID

#### `batchInitializeVotes(string[] titles, string[] descriptions, string[][] optionsList, uint256[] startTimes, uint256[] endTimes)`
Initialize multiple votes in a single transaction.
- **Parameters:**
  - `titles`: Array of vote titles
  - `descriptions`: Array of vote descriptions
  - `optionsList`: Array of option arrays
  - `startTimes`: Array of vote start times
  - `endTimes`: Array of vote end times

## Vote Status

- **Active**: Vote is currently accepting votes
- **Inactive**: Vote period has ended or not started

## Error Handling

- Invalid option indices
- Double voting attempts
- Vote timing violations
- Array length mismatches in batch operations


/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const EncryptedVotingSystemABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
    {
      "anonymous": false,
      "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
      },
        {
          "indexed": true,
          "internalType": "address",
          "name": "voter",
          "type": "address"
        }
      ],
    "name": "VoteCast",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
      },
        {
          "indexed": true,
          "internalType": "address",
        "name": "creator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
        "name": "title",
          "type": "string"
        }
      ],
    "name": "VoteCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
    },
        {
          "indexed": true,
          "internalType": "address",
        "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "decryptedVote",
          "type": "uint32"
        }
      ],
      "name": "VoteDecrypted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
        "indexed": true,
          "internalType": "uint256",
        "name": "voteId",
          "type": "uint256"
        }
      ],
    "name": "VotingEnded",
      "type": "event"
    },
    {
      "inputs": [
        {
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "encryptedOptionId",
        "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "castVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "durationInDays",
        "type": "uint256"
      }
    ],
    "name": "createVote",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
      }
    ],
    "name": "endVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
        }
      ],
    "name": "getEncryptedVoteChoices",
      "outputs": [
        {
        "internalType": "bytes32[]",
        "name": "encryptedVotes",
        "type": "bytes32[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
    "name": "getNextVoteId",
      "outputs": [
        {
        "internalType": "uint256",
          "name": "",
        "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
        }
      ],
    "name": "getVote",
      "outputs": [
        {
          "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
          "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
    },
    {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
        {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
        }
      ],
      "name": "getVoteCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
      {
        "internalType": "uint256",
        "name": "voteId",
        "type": "uint256"
      },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
    "name": "hasVotedInVote",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
    "name": "owner",
      "outputs": [
        {
        "internalType": "address",
          "name": "",
        "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
        "name": "voteId",
          "type": "uint256"
      },
        {
          "internalType": "uint256",
          "name": "requestId",
          "type": "uint256"
        }
      ],
    "name": "requestDecryptVoteResults",
      "outputs": [
        {
        "internalType": "bytes32[]",
          "name": "",
        "type": "bytes32[]"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];


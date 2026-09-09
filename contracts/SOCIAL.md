# Tug of War Arena — Fun Social Decentralized Features

Production-ready social contracts for the Friendzone Buildathon. These sit beside the existing arena, guild, and referral contracts and compose through `ISocialReputation`.

## Table of Contents

1. [Social Graph & Reputation System](#1-social-graph--reputation-system)
2. [Content Tipping & Monetization](#2-content-tipping--monetization)
3. [Social Prediction Market](#3-social-prediction-market)
4. [Social Staking & Governance](#4-social-staking--governance)
5. [NFT Badge Protocol (Soulbound)](#5-nft-badge-protocol-soulbound)
6. [Decentralized Chat & Messaging](#6-decentralized-chat--messaging)
7. [Social Quests & Achievement System](#7-social-quests--achievement-system)
8. [Social Leaderboard with Reputation](#8-social-leaderboard-with-reputation)
9. [Friend Referral & Social Rewards](#9-friend-referral--social-rewards)
10. [DAO Social Engagement](#10-dao-social-engagement)
11. [Social Token Bonding Curve](#12-social-token-bonding-curve)
12. [Faction-Based DeFi Gaming](#13-faction-based-defi-gaming)
13. [Gamified DAO Voting](#14-gamified-dao-voting-vote-to-earn)
14. [Social Reputation with Staking](#15-social-reputation-with-staking)
15. [On-Chain Check-In & Streaks](#16-on-chain-check-in--streak-system)
16. [Social Prediction with Leaderboards](#17-social-prediction-market-with-leaderboards)
17. [Quest Protocol](#18-quest-protocol-with-proof-of-completion)
18. [Content Tipping with Curators](#19-social-content-tipping-with-curator-rewards)
19. [Decentralized Identity](#20-decentralized-identity--achievement-badges)
20. [Deployment & Testing Guide](#21-deployment--testing-guide)

## Layout

```text
contracts/src/social/
├── SocialReputation.sol      # Trust scores, follows, interaction log
├── ContentTipping.sol        # FZONE tips with reputation multipliers
├── PredictionMarket.sol      # Yes/No community markets
├── SocialStaking.sol         # Stake FZONE or wearables for governance power
├── SoulboundBadges.sol       # Non-transferable ERC-1155 achievements
├── DecentralizedChat.sol     # DMs, threads, block lists
├── SocialQuests.sol          # Social action quests
├── SocialLeaderboard.sol    # Multi-metric ranking
├── FriendReferral.sol       # Multi-tier invite rewards
└── DAOSocialEngagement.sol  # Gamified DAO participation
```

Existing Friendzone social contracts (`FriendzoneBadges`, `FriendzoneGuilds`, `FriendzoneReferrals`) remain in this folder. The new suite is additive.

Part 5 (social DeFi & gamification) lives in the same folder:

```text
├── SocialBondingCurve.sol    # Community token bonding curve
├── FactionDeFi.sol           # Red vs Blue deposit game
├── GamifiedDAO.sol           # Vote-to-earn proposals
├── ReputationStaking.sol     # Stake for XP / reputation
├── CheckInStreak.sol         # Daily check-in streaks
├── SocialPrediction.sol      # Prediction markets + leaderboard
├── QuestProtocol.sol         # Proof-of-completion quests
├── ContentTippingCurator.sol # Tips with curator share
└── DecentralizedIdentity.sol # Profiles + soulbound achievements
```

## 1. Social Graph & Reputation System

**File:** `src/social/SocialReputation.sol`

Tracks score, trust (0–100), followers, and an interaction log. Positive actions (`tip`, `endorse`, `follow`, `quest_complete`) raise score; operator-recorded reports lower it. Score decays after 30 days of inactivity. `ContentTipping` and `SocialQuests` are wired as operators so they can write interactions without an owner key.

## 2. Content Tipping & Monetization

**File:** `src/social/ContentTipping.sol`

Creators register a content id (IPFS hash). Tippers pay the stated FZONE amount. High-reputation tippers record a larger social value (1.0x–2.0x) without being charged extra. Creators claim tips; a 0.5% platform fee accrues separately and cannot drain unclaimed principal.

## 3. Social Prediction Market

**File:** `src/social/PredictionMarket.sol`

Anyone can open a yes/no market (1–30 days). The creator or owner resolves after `endTime`. Winners share the pool minus 1%. Canceled markets refund via `claimRefund`.

## 4. Social Staking & Governance

**File:** `src/social/SocialStaking.sol`

Stake FZONE or a wearable into a pool. Governance power is amount- and rarity-weighted. Unstake respects the pool lock. Rewards pay from a funded surplus so staked principal cannot be spent as yield.

## 5. NFT Badge Protocol (Soulbound)

**File:** `src/social/SoulboundBadges.sol`

ERC-1155 badges with tiers Bronze → Diamond. `_update` and `setApprovalForAll` revert, so badges cannot be transferred or listed. Badge ids start at 1 so quests can use `0` as “no badge”.

## 6. Decentralized Chat & Messaging

**File:** `src/social/DecentralizedChat.sol`

Stores IPFS hashes or encrypted payloads, not plaintext at scale. Supports DMs, public threads, delete-by-sender, and per-user block lists. Optional `minReputationToSend` gate.

## 7. Social Quests & Achievement System

**File:** `src/social/SocialQuests.sol`

Owner creates quests (ids start at 1 so `0` can mean “not accepted”). Players accept, the operator reports progress, and claim pays reputation plus an optional soulbound badge. Repeatable quests honor `repeatCooldown`.

## 8. Social Leaderboard with Reputation

**File:** `src/social/SocialLeaderboard.sol`

Weighted rank: reputation 50 / engagement 30 / influence 20 (owner-adjustable, must sum to 100).

## 9. Friend Referral & Social Rewards

**File:** `src/social/FriendReferral.sol`

Five invite tiers (1.0x–3.0x). Rewards accrue on bind and are claimed once — they are never paid on both bind and claim. Circular referrals are rejected.

## 10. DAO Social Engagement

**File:** `src/social/DAOSocialEngagement.sol`

Operator-recorded votes, proposals, comments, attendance, creation, and moderation. Daily streaks survive a 48h window. Pending score converts to FZONE on claim (`score * 1e18 / 10`).

## 12. Social Token Bonding Curve

**File:** `src/social/SocialBondingCurve.sol`

Linear community tokens. Spot price is `supply * 1000 + 1e18`. Buy/sell use a closed-form series so lots are not O(n) gas. Creator seed supply is paid into the reserve. Fees (max 10%) leave the curve.

## 13. Faction-Based DeFi Gaming

**File:** `src/social/FactionDeFi.sol`

Players pick Red or Blue and deposit FZONE. Time-weighted deposits mint faction points. The owner funds a reward-token prize pool; the winning side splits it after the epoch. Principal is always withdrawable — prizes never come from deposits.

## 14. Gamified DAO Voting (Vote-to-Earn)

**File:** `src/social/GamifiedDAO.sol`

Voters buy weight with FZONE. After the voting window, the winning side splits the pool minus 1%. Losing votes stay in the pool.

## 15. Social Reputation with Staking

**File:** `src/social/ReputationStaking.sol`

Lock FZONE (7d–365d) for a 1.0x–3.0x XP multiplier. Daily XP accrues from still-locked principal. Unstake takes a global stake id. Operator can add social XP (referrals, content, votes).

## 16. On-Chain Check-In & Streak System

**File:** `src/social/CheckInStreak.sol`

One check-in per UTC day. A 48h window keeps the streak alive. Rewards scale with streak length; 7 / 30 / 100 day milestones pay a bonus from the contract treasury.

## 17. Social Prediction Market with Leaderboards

**File:** `src/social/SocialPrediction.sol`

Yes/No markets (1–30 days). Creator or owner resolves. Winners share the pool minus 1%. Points accrue for wins, streaks, and 80%+ accuracy (once). `getLeaderboard` is a pure view and does not write ranks.

## 18. Quest Protocol with Proof-of-Completion

**File:** `src/social/QuestProtocol.sol`

Owner creates quests. An operator attests progress. Claim pays FZONE from the treasury and optionally mints a `DecentralizedIdentity` achievement. Repeatable quests honor cooldown. Non-repeatable quests cannot be claimed twice.

## 19. Social Content Tipping with Curator Rewards

**File:** `src/social/ContentTippingCurator.sol`

Creators register content with a curator. Tips pay the creator immediately; the curator share (default 10%, max 50%) accrues until `claimCuratorReward`.

## 20. Decentralized Identity & Achievement Badges

**File:** `src/social/DecentralizedIdentity.sol`

Profiles (name, bio, avatar, social links) plus ERC-1155 achievements. Soulbound ids revert on transfer and `setApprovalForAll`. Achievement ids start at 1 so quests can use `0` as “no badge”.

## 21. Deployment & Testing Guide

```bash
cd contracts
pnpm install
pnpm compile
pnpm test:social
pnpm deploy:social
```

Polygon Amoy:

```bash
cp .env.example .env
# optional: FZONE_ADDRESS and NFT_CONTRACT to reuse a prior deploy
pnpm deploy:social:amoy
```

`scripts/deploy-social.ts` deploys the ten contracts, sets tipping and quests as reputation operators, funds referral / staking / DAO treasuries, and writes `deployments/social-<chainId>.json`. Copy those addresses into `lib/web3/addresses.ts`.

Social DeFi (Part 5):

```bash
pnpm test:social-defi
pnpm deploy:social-defi
pnpm deploy:social-defi:amoy
```

`scripts/deploy-social-de-fi.ts` deploys the nine DeFi/gamification contracts, wires `QuestProtocol` as a `DecentralizedIdentity` operator, funds check-in and quest treasuries, and writes `deployments/social-defi-<chainId>.json`.

### Tests

`pnpm test:social` covers reputation + follow, tipping claims, prediction payouts, staking, soulbound transfer reverts, chat blocks, quest rewards, leaderboard order, referral claims, DAO streaks, bonding-curve buy/sell, faction prize claims, vote-to-earn, reputation staking unlocks, check-in streaks, social prediction leaderboards, quest proof-of-completion, curator tips, and identity badges.

## Contract map

| Contract | Purpose |
|----------|---------|
| **SocialReputation** | On-chain reputation and trust graph |
| **ContentTipping** | Social tipping with reputation multipliers |
| **PredictionMarket** | Social prediction markets |
| **SocialStaking** | Stake tokens/NFTs for governance power |
| **SoulboundBadges** | Non-transferable achievement badges |
| **DecentralizedChat** | On-chain messaging with block lists |
| **SocialQuests** | Social action quests with rewards |
| **SocialLeaderboard** | Multi-metric social ranking |
| **FriendReferral** | Multi-tier referral program |
| **DAOSocialEngagement** | Gamified DAO participation rewards |
| **SocialBondingCurve** | Linear community-token curve with fees |
| **FactionDeFi** | Red/Blue deposits competing for funded epoch rewards |
| **GamifiedDAO** | Vote-to-earn: winners split the vote pool |
| **ReputationStaking** | Locked FZONE for XP, levels, and trust |
| **CheckInStreak** | Daily check-in with streak and milestone bonuses |
| **SocialPrediction** | Yes/No markets with accuracy leaderboard |
| **QuestProtocol** | Operator-attested quests, FZONE + soulbound badges |
| **ContentTippingCurator** | Creator tips with a curator discovery share |
| **DecentralizedIdentity** | Profiles and soulbound ERC-1155 achievements |

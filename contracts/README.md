# Friendzone Smart Contracts

On-chain layer for **Tug of War Arena**: match staking, FZONE prizes, wearable NFTs, social badges, guilds, referrals, verifiable randomness, Plaza tournaments, and token-weighted governance.

Gameplay itself stays off-chain. The mobile client and tRPC room already compute pulls, streaks, and the 44-point rope line. These contracts record the lobby, collect entry fees, and settle the result the authoritative server already produced.

```text
Mobile / Crew arena  →  game server (operator)  →  TugOfWarArena.settleMatch
        pull taps              legal deltas              prizes + VRF wearable
```

## Layout

```text
contracts/
├── src/
│   ├── core/
│   │   ├── TugOfWarArena.sol      # Match lifecycle, prizes, operator settlement
│   │   ├── FriendzoneToken.sol    # FZONE ERC-20
│   │   └── FriendzoneNFT.sol      # Wearables with rarity bonuses
│   ├── social/
│   │   ├── FriendzoneBadges.sol   # ERC-1155 achievements
│   │   ├── FriendzoneGuilds.sol   # Crew guilds (1-indexed ids)
│   │   ├── FriendzoneReferrals.sol
│   │   ├── SocialReputation.sol  # Trust graph + interaction log
│   │   ├── ContentTipping.sol
│   │   ├── PredictionMarket.sol
│   │   ├── SocialStaking.sol
│   │   ├── SoulboundBadges.sol    # Non-transferable ERC-1155
│   │   ├── DecentralizedChat.sol
│   │   ├── SocialQuests.sol
│   │   ├── SocialLeaderboard.sol
│   │   ├── FriendReferral.sol
    │   │   ├── DAOSocialEngagement.sol
    │   │   ├── SocialBondingCurve.sol
    │   │   ├── FactionDeFi.sol
    │   │   ├── GamifiedDAO.sol
    │   │   ├── ReputationStaking.sol
    │   │   ├── CheckInStreak.sol
    │   │   ├── SocialPrediction.sol
    │   │   ├── QuestProtocol.sol
    │   │   ├── ContentTippingCurator.sol
    │   │   └── DecentralizedIdentity.sol
│   ├── gamification/             # XP, battle pass, quests, loot
│   ├── randomness/
│   │   ├── VRFConsumer.sol        # Chainlink-compatible consumer + local fallback
│   │   ├── MockVRFCoordinator.sol
│   │   └── ChainlinkV2PlusAdapter.sol
│   ├── tournaments/TournamentBracket.sol
│   ├── governance/FriendzoneDAO.sol
│   ├── extensions/
│   │   ├── FriendzoneStaking.sol
│   │   ├── FriendzoneLending.sol
│   │   ├── FriendzoneBattle.sol
│   │   ├── FriendzoneBreeding.sol
│   │   ├── FriendzoneDynamic.sol
│   │   ├── FriendzoneMarketplace.sol
│   │   ├── FriendzoneLootBox.sol
│   │   ├── FriendzoneCrafting.sol
│   │   └── FriendzoneLeaderboard.sol
│   ├── utils/                     # MathUtils, ArrayUtils, ReentrancyGuard
│   └── interfaces/
├── test/FriendzoneSuite.test.ts
├── test/FriendzoneExtensions.test.ts
├── test/social/
├── scripts/deploy.ts
├── scripts/deploy-social.ts
├── scripts/deploy-social-de-fi.ts
└── hardhat.config.ts
```

## Why settlement is operator-gated

Putting every tap on Polygon would break the one-thumb arena (latency + gas). `updatePower` and `settleMatch` are callable by `matchOperator` — the existing game server — not by the player wallet directly. Players still pay and join on-chain; the server relays the legal result.

Win threshold **44** and match duration **30s** match `lib/game-rules.ts`.

## Gamification suite

Progression, social, and NFT loops for the Friendzone buildathon. Sources: `src/gamification/` (also linked from `gamification/`).

| Contract | Purpose |
|---|---|
| `ExperienceSystem` | XP, levels, tiers, daily streaks |
| `QuestSystem` | Accept / progress / claim quests |
| `AchievementBadges` | ERC-1155 soulbound badges |
| `Leaderboard` | Integer ELO + seasonal prizes |
| `NFTStakingBoost` | Rarity-boosted NFT staking |
| `BattlePass` | Free and premium seasonal tracks |
| `NFTEvolution` | Play-to-evolve ERC-721s |
| `Challenges` | Epoch-reset daily/weekly challenges |
| `GuildWars` | Crew wars and reputation |
| `ReferralSocial` | Pull-based referral rewards |
| `LootBoxVRF` | VRF loot boxes (Chainlink-compatible callback) |
| `TournamentELO` | ELO-seeded single-elim brackets |

Game backends call `setOperator(backend, true)` so match results can grant XP without transferring ownership. Players pull-claim daily login, quest, referral, staking, and tournament rewards.

```bash
pnpm test:gamification
pnpm deploy                 # scripts/deploy-gamification.ts
```

## Commands

```bash
cd contracts
pnpm install
pnpm test
pnpm compile
pnpm deploy:local
pnpm deploy:social
pnpm deploy:social-defi
```

Polygon Amoy:

```bash
cp .env.example .env   # set PRIVATE_KEY and optional VRF_* values
pnpm deploy:amoy
```

If `VRF_COORDINATOR` is unset, deploy uses `MockVRFCoordinator` so a hackathon demo does not require a Chainlink subscription. For production Amoy VRF v2.5, point `VRF_COORDINATOR` at the official coordinator (or `ChainlinkV2PlusAdapter`).

After deploy, copy addresses into `lib/web3/addresses.ts` so the Expo client can attach a wallet without changing the offline demo path.

## Tests

`pnpm test` covers:

- FZONE supply cap
- create / join / leave / settle match + 80% prize split
- threshold finish via operator `updatePower`
- async mock VRF wearable mint
- NFT rarity bonuses
- badges, 1-indexed guilds, single-claim referrals
- tournament NFT lock + payout
- DAO parameter vote against the arena
- Gamification: XP/levels, quests, soulbound badges, ELO, staking, battle pass, NFT evolution, challenges, guild wars, referrals, VRF loot boxes, tournament brackets
- Extensions: NFT staking, lending, battles, breeding, dynamic NFTs, marketplace, loot boxes, crafting, leaderboard
- Social suite: reputation/follow, tipping, prediction markets, staking, soulbound badges, chat, quests, leaderboard, multi-tier referrals, DAO engagement
- Social DeFi: bonding curves, faction epochs, vote-to-earn, reputation staking, check-in streaks, prediction leaderboards, quest proof-of-completion, curator tips, identity badges

The social layer is documented in [`SOCIAL.md`](./SOCIAL.md).

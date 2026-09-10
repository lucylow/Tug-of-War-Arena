# Mobile + 3D Hybrid Architecture

Tug of War Arena: Friendzone has two clients that share one Friendzone domain.

1. **React Native / Expo** — portrait companion (crew, rooms, missions, wallet status, World preview).
2. **Decentraland SDK7 World** — spatial 3D destination (`decentraland-world/`).

The native Decentraland client currently does not run on mobile devices. The mobile app must not claim to embed the Explorer.

```mermaid
flowchart LR
    MOBILE[React Native Mobile]
    DOMAIN[Shared Friendzone Domain]
    WORLD[Decentraland SDK7 World]
    SERVER[Game / Social Server]
    WEB3[Optional Web3]
    MOCK[Deterministic Demo Data]

    MOCK --> DOMAIN
    DOMAIN --> MOBILE
    DOMAIN --> WORLD
    MOBILE --> SERVER
    WORLD --> SERVER
    MOBILE --> WEB3
    WORLD --> WEB3
```

```mermaid
flowchart TB
    DISCOVER[Discover]
    JOIN[Join Crew]
    PLAY2D[2D Mobile Companion]
    PLAY3D[3D Decentraland World]
    RESULT[Match Result]
    PROGRESS[Progress]
    SOCIAL[Social]
    PROOF[Optional Blockchain Proof]

    DISCOVER --> JOIN
    JOIN --> PLAY2D
    JOIN --> PLAY3D
    PLAY2D --> RESULT
    PLAY3D --> RESULT
    RESULT --> PROGRESS
    RESULT --> SOCIAL
    RESULT --> PROOF
    PROGRESS --> JOIN
    SOCIAL --> JOIN
```

Shared protocol: `shared/friendzone-world-protocol.ts`  
Canonical demo seed: `shared/demo-world.ts`  
Mobile projection: `lib/world/projection.ts`

# EVM PumpFun Smart Contract ⚡

High-performance implementation of pump.fun-style bonding-curve and AMM mechanics for EVM chains. Deployable on Base, Ethereum, and other EVM-compatible networks.

---

## Architecture

The system has two phases per token:

1. **Bonding curve (PumpFun)** — New tokens trade on a constant-product style curve until a threshold (mcap or sell-down) is hit.
2. **Graduation** — Completed curves can be withdrawn by the protocol owner; liquidity can be moved to a Uniswap-style AMM (Router + Factory/Pair) for continued trading.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   TokenFactory  │────▶│     PumpFun      │     │ PancakeFactory  │
│ (deploy ERC20 + │     │ (bonding curve   │     │ + Router + Pair  │
│  create pool)   │     │  buy/sell/withdraw)     │ (AMM post-grad)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Contract Overview

| Contract | Role |
|----------|------|
| **PumpFun** | Bonding-curve engine: `createPool`, `buy`, `sell`, `withdraw` (owner). Constant-product pricing with configurable virtual/real reserves, fee (basis points), and create fee. |
| **TokenFactory** | Deploys ERC20 (name/symbol, fixed supply), approves PumpFun, pays create fee, and calls `createPool` in one tx. Owner-only `setPoolAddress`. |
| **Token** | Standard ERC20 (OpenZeppelin); minted to creator with fixed total supply. |
| **PancakeFactory** | UniswapV2-style factory: `createPair(tokenA, tokenB)` via CREATE2, `feeTo`, `txFee`, `getPair`. Implements `IFactory` for Router. |
| **PancakePair** | Minimal pair: `initialize(token0, token1)`; holds pair state for Router. |
| **Pair** | Full AMM pair used with Router: reserves, `mint`/`burn`/`swap`, `approval`, `transferETH`, `getReserves`, `kLast`. |
| **Router** | Liquidity and swap operations: `addLiquidityETH`, `removeLiquidityETH`, `swapTokensForETH`, `swapETHForTokens`, `getAmountsOut`; uses `IFactory` and referral/tx fee. |
| **Factory.sol** | Interface `IFactory`: `getPair`, `feeTo`, `txFee` (used by Router). |

---

## Bonding Curve (PumpFun)

- **Pricing**: Constant-product over virtual reserves.  
  `ethCost = (virtualEthReserves * virtualTokenReserves) / (virtualTokenReserves - tokenAmount) - virtualEthReserves`
- **Reserves**: Per-token curve state: `virtualTokenReserves`, `virtualEthReserves`, `realTokenReserves`, `realEthReserves`, `tokenTotalSupply`, `mcapLimit`, `complete`.
- **Completion**: Curve marks `complete` when mcap exceeds `mcapLimit` or real token reserve percentage falls below 20%. Only then can owner call `withdraw(token)` to pull real ETH and tokens.
- **Fees**: Create fee (flat ETH) and trading fee (basis points) sent to `feeRecipient`. Excess ETH in `createPool` is refunded to caller.
- **Security**: `ReentrancyGuard` on pool creation and trading; CEI in `sell`; owner set in constructor; no external calls before state updates in critical paths.

---

## Tech Stack

| Component | Version / choice |
|-----------|-------------------|
| Solidity | `0.8.24` |
| Compiler | Optimizer enabled, `runs: 200`, `viaIR: true` (resolves stack-too-deep in Router) |
| Framework | Hardhat 2.x + Ignition |
| Dependencies | OpenZeppelin Contracts v5, ethers v6, TypeScript |
| Networks | Base (8453), Base Sepolia (84532); configurable via `hardhat.config.ts` |

---

## Development

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Install

```bash
npm install --legacy-peer-deps
```

### Build

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

Tests cover TokenFactory deployment, PumpFun pool creation, and buy/sell on the bonding curve (see `test/test.ts`).

### Deploy (Base)

Set deployer key (never commit):

```bash
# Windows (PowerShell)
$env:PRIVATE_KEY = "0x..."

# Linux/macOS
export PRIVATE_KEY=0x...
```

Deploy with Hardhat Ignition (example for Lock module):

```bash
# Base Mainnet
npx hardhat ignition deploy ignition/modules/Lock.ts --network base

# Base Sepolia
npx hardhat ignition deploy ignition/modules/Lock.ts --network baseSepolia
```

Add and run Ignition modules for PumpFun, TokenFactory, and (optionally) PancakeFactory/Router as needed.

### Verify on Explorer

Configure Etherscan/BaseScan API key in `hardhat.config.ts` and use:

```bash
npx hardhat verify --network base <DEPLOYED_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## Configuration

- **PumpFun constructor**: `feeRecipient`, `createFee` (wei), `feeBasisPoint` (e.g. 100 = 1%).
- **TokenFactory**: Owner must call `setPoolAddress(pumpFunAddress)` after deployment.
- **PancakeFactory**: `feeToSetter` in constructor; then `setFeeTo`, `setTxFee`, `setFeeToSetter` as needed for Router compatibility.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contact

- [Telegram](https://t.me/OnChainMee)
- [Twitter](https://x.com/OnChainMee)

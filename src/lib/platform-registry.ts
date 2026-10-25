import { AssetClass, OutcomeMode, PlatformSpec, QueryExampleSpec } from "./tipping-point-types";

/**
 * Complete 16-Platform MVP Registry (Assume All 16 Accounts Connected in MVP).
 * Every platform carries its authentic SVG brand logo in `/assets/logos/<name>.svg`.
 */
export const PLATFORM_REGISTRY: Record<string, PlatformSpec> = {
  plat_alpaca: {
    platform_id: "plat_alpaca",
    name: "Alpaca Markets",
    short_name: "Alpaca",
    venue_label: "NASDAQ / NYSE Equities",
    category: "Stock & Crypto Brokerage",
    logo_svg: "/assets/logos/alpaca.svg",
    brand_hex: "#FCD535",
    text_hex: "#111111",
    supported_asset_classes: ["EQUITY", "ETF", "CRYPTO_SPOT"],
    auth_mode: "1-Click OAuth 2.0 (Trading + Read)",
    masked_account_id: "acc_alpaca_992a",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "42,500.00",
    supported_symbols: ["NVDA", "TSLA", "AAPL", "MSFT", "AMD", "SPY", "QQQ", "SMH", "GLD", "TLT"],
  },
  plat_ibkr: {
    platform_id: "plat_ibkr",
    name: "Interactive Brokers",
    short_name: "IBKR",
    venue_label: "IBKR SMART / NYSE",
    category: "Global Multi-Asset Broker",
    logo_svg: "/assets/logos/ibkr.svg",
    brand_hex: "#D9232A",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["EQUITY", "ETF"],
    auth_mode: "OAuth 2.0 Web API + FIX",
    masked_account_id: "acc_ibkr_U8841",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "115,000.00",
    supported_symbols: ["GLD", "USO", "TLT", "SPY", "QQQ", "NVDA", "MSFT", "AAPL"],
  },
  plat_schwab: {
    platform_id: "plat_schwab",
    name: "Charles Schwab",
    short_name: "Schwab",
    venue_label: "NASDAQ / NYSE Retail",
    category: "Retail Stock & Options",
    logo_svg: "/assets/logos/schwab.svg",
    brand_hex: "#00A0DF",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["EQUITY", "ETF"],
    auth_mode: "Schwab Trader OAuth 2.0",
    masked_account_id: "acc_schwab_441c",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "68,400.00",
    supported_symbols: ["AAPL", "TSLA", "NVDA", "AMZN", "QQQ", "IWM", "SPY"],
  },
  plat_robinhood: {
    platform_id: "plat_robinhood",
    name: "Robinhood",
    short_name: "Robinhood",
    venue_label: "Equities & Event Contracts",
    category: "Stocks, Crypto & Events",
    logo_svg: "/assets/logos/robinhood.svg",
    brand_hex: "#00C805",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["EQUITY", "ETF", "CRYPTO_SPOT", "PREDICTION"],
    auth_mode: "Connected OAuth Session",
    masked_account_id: "acc_rh_773e",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "19,850.00",
    supported_symbols: ["TSLA", "NVDA", "AAPL", "SPY", "BTC-USD", "FED-RATE-EVENT"],
  },
  plat_tradier: {
    platform_id: "plat_tradier",
    name: "Tradier / Webull",
    short_name: "Tradier",
    venue_label: "Equities & Listed Options",
    category: "Retail Stock & Options",
    logo_svg: "/assets/logos/tradier.svg",
    brand_hex: "#0052CC",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["EQUITY", "ETF"],
    auth_mode: "Public OAuth 2.0 (Trade + Read)",
    masked_account_id: "acc_tradier_610b",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "24,000.00",
    supported_symbols: ["NVDA", "AMD", "SPY", "QQQ", "TSLA"],
  },
  plat_coinbase: {
    platform_id: "plat_coinbase",
    name: "Coinbase Advanced",
    short_name: "Coinbase",
    venue_label: "Spot & INTX Orderbook",
    category: "Crypto Exchange (CEX)",
    logo_svg: "/assets/logos/coinbase.svg",
    brand_hex: "#0052FF",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["CRYPTO_SPOT", "PERP"],
    auth_mode: "Sign in with Coinbase OAuth 2.0",
    masked_account_id: "acc_cb_551f",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "36,200.00",
    supported_symbols: ["BTC-USD", "ETH-USD", "SOL-USD", "LINK-USD"],
  },
  plat_binance: {
    platform_id: "plat_binance",
    name: "Binance",
    short_name: "Binance",
    venue_label: "Spot & USDT Perps",
    category: "Crypto Exchange (CEX)",
    logo_svg: "/assets/logos/binance.svg",
    brand_hex: "#F0B90B",
    text_hex: "#181A20",
    supported_asset_classes: ["CRYPTO_SPOT", "PERP"],
    auth_mode: "Fast-API OAuth / Ed25519 Key",
    masked_account_id: "acc_bnb_309d",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "54,000.00",
    supported_symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT", "BNB-USDT"],
  },
  plat_kraken: {
    platform_id: "plat_kraken",
    name: "Kraken Pro",
    short_name: "Kraken",
    venue_label: "Spot & Margin CLOB",
    category: "Crypto Exchange (CEX)",
    logo_svg: "/assets/logos/kraken.svg",
    brand_hex: "#5741D9",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["CRYPTO_SPOT", "PERP"],
    auth_mode: "Kraken OAuth 2.0 / Scoped Key",
    masked_account_id: "acc_krk_118a",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "21,500.00",
    supported_symbols: ["BTC-USD", "ETH-USD", "SOL-USD", "DOT-USD"],
  },
  plat_okx: {
    platform_id: "plat_okx",
    name: "OKX Exchange",
    short_name: "OKX",
    venue_label: "Unified Spot & Perps",
    category: "Crypto Exchange (CEX)",
    logo_svg: "/assets/logos/okx.svg",
    brand_hex: "#111111",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["CRYPTO_SPOT", "PERP"],
    auth_mode: "OKX Fast-API OAuth",
    masked_account_id: "acc_okx_882c",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "31,000.00",
    supported_symbols: ["BTC-USDT", "ETH-USDT", "SOL-USDT"],
  },
  plat_bybit: {
    platform_id: "plat_bybit",
    name: "Bybit Unified",
    short_name: "Bybit",
    venue_label: "Spot & Linear Perps",
    category: "Crypto Exchange (CEX)",
    logo_svg: "/assets/logos/bybit.svg",
    brand_hex: "#F7A600",
    text_hex: "#17181E",
    supported_asset_classes: ["CRYPTO_SPOT", "PERP"],
    auth_mode: "Bybit Broker OAuth",
    masked_account_id: "acc_byb_904e",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "27,400.00",
    supported_symbols: ["BTC-USDT", "ETH-USDT", "XRP-USDT", "SOL-USDT"],
  },
  plat_hyperliquid: {
    platform_id: "plat_hyperliquid",
    name: "Hyperliquid L1",
    short_name: "Hyperliquid",
    venue_label: "Onchain Perps CLOB",
    category: "Onchain Perps & Spot DEX",
    logo_svg: "/assets/logos/hyperliquid.svg",
    brand_hex: "#072723",
    text_hex: "#50D2C1",
    supported_asset_classes: ["PERP", "CRYPTO_SPOT"],
    auth_mode: "Privy EIP-712 ApproveAgent Signer",
    masked_account_id: "0x71C...9A2B (Agent)",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "48,900.00",
    supported_symbols: ["BTC-PERP", "ETH-PERP", "SOL-PERP", "HYPE-PERP"],
  },
  plat_dydx: {
    platform_id: "plat_dydx",
    name: "dYdX Chain (v4)",
    short_name: "dYdX",
    venue_label: "Decentralized Perps",
    category: "Onchain Perps DEX",
    logo_svg: "/assets/logos/dydx.svg",
    brand_hex: "#6966FF",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["PERP"],
    auth_mode: "Subaccount Session Key Signer",
    masked_account_id: "dydx1...4k9p",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "18,500.00",
    supported_symbols: ["BTC-PERP", "ETH-PERP", "SOL-PERP"],
  },
  plat_uniswap: {
    platform_id: "plat_uniswap",
    name: "Uniswap (v3 / v4)",
    short_name: "Uniswap",
    venue_label: "Onchain AMM Swap",
    category: "Onchain Spot AMM DEX",
    logo_svg: "/assets/logos/uniswap.svg",
    brand_hex: "#FF007A",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["DEFI_SWAP"],
    auth_mode: "Privy Permit2 Scoped Allowance",
    masked_account_id: "0x71C...9A2B (Base/ETH)",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "15,200.00",
    supported_symbols: ["WETH-USDC", "WBTC-USDC", "UNI-USDC"],
  },
  plat_polymarket: {
    platform_id: "plat_polymarket",
    name: "Polymarket",
    short_name: "Polymarket",
    venue_label: "Prediction Event CLOB",
    category: "Prediction Market",
    logo_svg: "/assets/logos/polymarket.svg",
    brand_hex: "#0066FF",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["PREDICTION"],
    auth_mode: "Privy Wallet + EIP-712 CLOB Signer",
    masked_account_id: "0x94A...3E1C (USDC)",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "14,500.00",
    supported_symbols: ["FED-CUT-25BPS-YES", "BTC-100K-YES", "MIDEAST-OIL-YES", "RECESSION-NO"],
  },
  plat_kalshi: {
    platform_id: "plat_kalshi",
    name: "Kalshi Exchange",
    short_name: "Kalshi",
    venue_label: "CFTC Event Contracts",
    category: "Prediction Market (CFTC)",
    logo_svg: "/assets/logos/kalshi.svg",
    brand_hex: "#00D287",
    text_hex: "#07271D",
    supported_asset_classes: ["PREDICTION"],
    auth_mode: "Kalshi OAuth / RSA-PSS Signed Key",
    masked_account_id: "acc_kalshi_204k",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "12,800.00",
    supported_symbols: ["KXFED-25BPS", "KXCPI-CORE", "KXRECESSION-26", "KXGDP-Q4"],
  },
  plat_forecastex: {
    platform_id: "plat_forecastex",
    name: "ForecastEx (IBKR)",
    short_name: "ForecastEx",
    venue_label: "Macro Forecast Contracts",
    category: "Prediction Market (CFTC)",
    logo_svg: "/assets/logos/forecastex.svg",
    brand_hex: "#B71C1C",
    text_hex: "#FFFFFF",
    supported_asset_classes: ["PREDICTION"],
    auth_mode: "IBKR ForecastEx Adapter",
    masked_account_id: "acc_fcex_512f",
    connected: true,
    authorization_epoch: 1,
    available_balance_usd: "20,000.00",
    supported_symbols: ["FFR-DEC-YES", "US-CPI-3PCT", "GDP-Q4-YES"],
  },
};

export function listAllPlatforms(): PlatformSpec[] {
  return Object.values(PLATFORM_REGISTRY);
}

export function getCompatiblePlatforms(assetClass: AssetClass): PlatformSpec[] {
  const matches = Object.values(PLATFORM_REGISTRY).filter((p) =>
    p.supported_asset_classes.includes(assetClass)
  );
  return matches.length > 0 ? matches : [PLATFORM_REGISTRY.plat_alpaca];
}

export function autoSelectPlatform(
  symbol: string,
  assetClass: AssetClass,
  queryText: string = ""
): PlatformSpec {
  const q = queryText.toLowerCase();
  const sym = symbol.toUpperCase();

  const explicitMap: Record<string, string> = {
    polymarket: "plat_polymarket",
    kalshi: "plat_kalshi",
    forecastex: "plat_forecastex",
    hyperliquid: "plat_hyperliquid",
    dydx: "plat_dydx",
    uniswap: "plat_uniswap",
    coinbase: "plat_coinbase",
    binance: "plat_binance",
    kraken: "plat_kraken",
    okx: "plat_okx",
    bybit: "plat_bybit",
    robinhood: "plat_robinhood",
    schwab: "plat_schwab",
    "interactive brokers": "plat_ibkr",
    ibkr: "plat_ibkr",
    tradier: "plat_tradier",
    alpaca: "plat_alpaca",
  };
  for (const [kw, pid] of Object.entries(explicitMap)) {
    if (q.includes(kw)) {
      return PLATFORM_REGISTRY[pid];
    }
  }

  if (
    assetClass === "PREDICTION" ||
    ["FED", "CPI", "RECESSION", "YES", "NO", "KX"].some((k) => sym.includes(k))
  ) {
    if (q.includes("kalshi") || sym.startsWith("KX") || q.includes("cpi") || q.includes("recession")) {
      if (q.includes("fed") && q.includes("cpi")) {
        return PLATFORM_REGISTRY.plat_polymarket;
      }
      return PLATFORM_REGISTRY.plat_kalshi;
    }
    return PLATFORM_REGISTRY.plat_polymarket;
  }

  if (assetClass === "DEFI_SWAP" || q.includes("swap") || q.includes("onchain") || sym.includes("WETH")) {
    return PLATFORM_REGISTRY.plat_uniswap;
  }

  if (
    assetClass === "PERP" ||
    sym.toLowerCase().includes("perp") ||
    q.includes("leverage") ||
    q.includes("2x") ||
    q.includes("3x")
  ) {
    if (q.includes("dydx")) return PLATFORM_REGISTRY.plat_dydx;
    return PLATFORM_REGISTRY.plat_hyperliquid;
  }

  if (assetClass === "CRYPTO_SPOT" || ["BTC", "ETH", "SOL", "BNB"].some((c) => sym.includes(c))) {
    if (q.includes("notify") || q.includes("alert")) {
      return PLATFORM_REGISTRY.plat_binance;
    }
    return PLATFORM_REGISTRY.plat_coinbase;
  }

  if (sym === "GLD" || sym === "USO") {
    return PLATFORM_REGISTRY.plat_ibkr;
  }

  if (sym === "TSLA") {
    if (q.includes("limit") || q.includes("10 shares")) {
      return PLATFORM_REGISTRY.plat_schwab;
    }
    return PLATFORM_REGISTRY.plat_robinhood;
  }

  if (sym === "AAPL" && (q.includes("20-day") || q.includes("moving average") || q.includes("email"))) {
    return PLATFORM_REGISTRY.plat_schwab;
  }

  return PLATFORM_REGISTRY.plat_alpaca;
}

/**
 * Complete 24-Query Classification Matrix from FRONTEND_DESIGN.md Section 6.3 (6 per outcome mode).
 */
export const QUERY_EXAMPLES_MATRIX: QueryExampleSpec[] = [
  // Category 1: Trading Workflow Diagram (6 Examples)
  {
    id: "wf_1",
    category: "STRATEGY_WORKFLOW",
    category_label: "1. Trading Workflow",
    query: "Buy NVDA when AI news is bullish",
    short_label: "Buy NVDA when AI news is bullish",
    auto_platform_id: "plat_alpaca",
    symbol: "NVDA",
    expected_summary: "Immediately builds 3-Part DAG · Auto-selects Alpaca · Smart Default $500",
  },
  {
    id: "wf_2",
    category: "STRATEGY_WORKFLOW",
    category_label: "1. Trading Workflow",
    query: "If Bitcoin breaks above $95,000 on positive ETF inflow news, buy $1,000 BTC",
    short_label: "Buy $1,000 BTC if > $95k & ETF news bullish",
    auto_platform_id: "plat_coinbase",
    symbol: "BTC-USD",
    expected_summary: "Immediately builds 3-Part DAG · Auto-selects Coinbase · $1,000 BTC-USD",
  },
  {
    id: "wf_3",
    category: "STRATEGY_WORKFLOW",
    category_label: "1. Trading Workflow",
    query: "Long $2,000 ETH at 3x leverage whenever ETH drops 5% in 1 hour and rebounds",
    short_label: "Long 3x ETH ($2k) on 5% 1h dip + rebound",
    auto_platform_id: "plat_hyperliquid",
    symbol: "ETH-PERP",
    expected_summary: "Immediately builds 3-Part DAG · Auto-selects Hyperliquid · 3x Isolated Perp",
  },
  {
    id: "wf_4",
    category: "STRATEGY_WORKFLOW",
    category_label: "1. Trading Workflow",
    query: "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
    short_label: "Buy $300 Fed Cut YES if CPI < 2.5%",
    auto_platform_id: "plat_polymarket",
    symbol: "FED-CUT-25BPS-YES",
    expected_summary: "Immediately builds 3-Part DAG · Auto-selects Polymarket · $300 YES Shares",
  },
  {
    id: "wf_5",
    category: "STRATEGY_WORKFLOW",
    category_label: "1. Trading Workflow",
    query: "Sell 50% of my TSLA position if EV delivery news turns bearish or stock falls 4%",
    short_label: "Sell 50% TSLA if EV news bearish or -4%",
    auto_platform_id: "plat_robinhood",
    symbol: "TSLA",
    expected_summary: "Immediately builds 3-Part DAG · Auto-selects Robinhood · Position Reduce",
  },
  {
    id: "wf_6",
    category: "STRATEGY_WORKFLOW",
    category_label: "1. Trading Workflow",
    query: "Whenever Gold rises 1.5% on geopolitical tension news, buy $500 of GLD",
    short_label: "Buy $500 GLD on +1.5% & geopolitical tension",
    auto_platform_id: "plat_ibkr",
    symbol: "GLD",
    expected_summary: "Immediately builds 3-Part DAG · Auto-selects IBKR · $500 Safe-Haven GLD",
  },

  // Category 2: Smart Notification Diagram (6 Examples)
  {
    id: "nt_1",
    category: "SMART_NOTICE",
    category_label: "2. Smart Notification",
    query: "Notify me when BTC moves 4% in 1 hour or breaking Bitcoin ETF news drops",
    short_label: "Notify when BTC moves 4% in 1h or ETF news",
    auto_platform_id: "plat_binance",
    symbol: "BTC-USD",
    expected_summary: "Immediately builds Smart Notice DAG · Push + Email + In-App (15m cooldown)",
  },
  {
    id: "nt_2",
    category: "SMART_NOTICE",
    category_label: "2. Smart Notification",
    query: "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
    short_label: "Alert when export news mentions NVDA/AMD",
    auto_platform_id: "plat_alpaca",
    symbol: "NVDA",
    expected_summary: "Immediately builds Smart Notice DAG · Entity Filter {NVDA, AMD} + Quick Trade",
  },
  {
    id: "nt_3",
    category: "SMART_NOTICE",
    category_label: "2. Smart Notification",
    query: "Ping me if the Fed December rate cut probability crosses above 75%",
    short_label: "Ping if Fed Cut odds cross above 75%",
    auto_platform_id: "plat_polymarket",
    symbol: "FED-CUT-25BPS-YES",
    expected_summary: "Immediately builds Smart Notice DAG · State Crossing > 75% (Push + Webhook)",
  },
  {
    id: "nt_4",
    category: "SMART_NOTICE",
    category_label: "2. Smart Notification",
    query: "Send me an email if AAPL drops below its 20-day moving average on high volume",
    short_label: "Email if AAPL < 20d SMA on high volume",
    auto_platform_id: "plat_schwab",
    symbol: "AAPL",
    expected_summary: "Immediately builds Smart Notice DAG · Technical Breakdown (Email + In-App)",
  },
  {
    id: "nt_5",
    category: "SMART_NOTICE",
    category_label: "2. Smart Notification",
    query: "Watch ETH perpetual funding rates and alert me if annualized funding exceeds 35%",
    short_label: "Alert if ETH-PERP annualized funding > 35%",
    auto_platform_id: "plat_hyperliquid",
    symbol: "ETH-PERP",
    expected_summary: "Immediately builds Smart Notice DAG · Funding Spike Telemetry (1h cooldown)",
  },
  {
    id: "nt_6",
    category: "SMART_NOTICE",
    category_label: "2. Smart Notification",
    query: "Let me know when Kalshi recession odds move by more than 10% in a single day",
    short_label: "Alert on ±10% Kalshi recession odds move",
    auto_platform_id: "plat_kalshi",
    symbol: "KXRECESSION-26",
    expected_summary: "Immediately builds Smart Notice DAG · 24h Odds Delta >= ±10% (Push + Email)",
  },

  // Category 3: Direct Trade Ticket (6 Examples)
  {
    id: "dt_1",
    category: "DIRECT_ACTION",
    category_label: "3. Direct Trade",
    query: "Buy $250 of Fed 25bps Cut YES shares right now",
    short_label: "Buy $250 Fed 25bps Cut YES right now",
    auto_platform_id: "plat_polymarket",
    symbol: "FED-CUT-25BPS-YES",
    expected_summary: "Immediately builds Direct Trade Ticket · Auto-selects Polymarket (68¢ · 15s lock)",
  },
  {
    id: "dt_2",
    category: "DIRECT_ACTION",
    category_label: "3. Direct Trade",
    query: "Buy $1,000 of NVDA right now at market",
    short_label: "Buy $1,000 of NVDA right now at market",
    auto_platform_id: "plat_alpaca",
    symbol: "NVDA",
    expected_summary: "Immediately builds Direct Trade Ticket · Auto-selects Alpaca ($211.11 · ~4.73 sh)",
  },
  {
    id: "dt_3",
    category: "DIRECT_ACTION",
    category_label: "3. Direct Trade",
    query: "Market buy 0.5 ETH right now",
    short_label: "Market buy 0.5 ETH right now",
    auto_platform_id: "plat_coinbase",
    symbol: "ETH-USD",
    expected_summary: "Immediately builds Direct Trade Ticket · Auto-selects Coinbase (~$1,620.00)",
  },
  {
    id: "dt_4",
    category: "DIRECT_ACTION",
    category_label: "3. Direct Trade",
    query: "Open a $1,500 2x long on SOL-PERP right now",
    short_label: "Open $1,500 2x long on SOL-PERP right now",
    auto_platform_id: "plat_hyperliquid",
    symbol: "SOL-PERP",
    expected_summary: "Immediately builds Direct Trade Ticket · Auto-selects Hyperliquid (2x Isolated)",
  },
  {
    id: "dt_5",
    category: "DIRECT_ACTION",
    category_label: "3. Direct Trade",
    query: "Sell 10 shares of TSLA at a $255.00 limit price",
    short_label: "Sell 10 TSLA at $255.00 limit price",
    auto_platform_id: "plat_schwab",
    symbol: "TSLA",
    expected_summary: "Immediately builds Direct Trade Ticket · Auto-selects Schwab ($2,550 Day Limit)",
  },
  {
    id: "dt_6",
    category: "DIRECT_ACTION",
    category_label: "3. Direct Trade",
    query: "Swap $500 USDC into WETH onchain right now",
    short_label: "Swap $500 USDC into WETH onchain now",
    auto_platform_id: "plat_uniswap",
    symbol: "WETH-USDC",
    expected_summary: "Immediately builds Direct Trade Ticket · Auto-selects Uniswap v3 (0.5% Slippage)",
  },

  // Category 4: Ask Confirmation / More Information (6 Vague Examples)
  {
    id: "cf_1",
    category: "ASK_USER_CONFIRMATION",
    category_label: "4. Ask Confirmation",
    query: "How would a surprise Fed rate cut impact Bitcoin and prediction markets?",
    short_label: "How would a surprise Fed cut impact BTC & prediction markets?",
    auto_platform_id: "plat_polymarket",
    symbol: "FED-CUT-25BPS-YES",
    expected_summary: "Vague Macro Question -> Synthesizes impact & asks user to pick 1-click diagram",
  },
  {
    id: "cf_2",
    category: "ASK_USER_CONFIRMATION",
    category_label: "4. Ask Confirmation",
    query: "I want to make a play on tomorrow's CPI inflation report — what can I do?",
    short_label: "I want to make a play on tomorrow's CPI report — what can I do?",
    auto_platform_id: "plat_kalshi",
    symbol: "KXCPI-CORE",
    expected_summary: "Vague Theme Question -> Presents Kalshi CPI, Alpaca Tech, & Hyperliquid Perp plays",
  },
  {
    id: "cf_3",
    category: "ASK_USER_CONFIRMATION",
    category_label: "4. Ask Confirmation",
    query: "AI chips look super strong lately, help me set something up.",
    short_label: "AI chips look super strong lately, help me set something up.",
    auto_platform_id: "plat_alpaca",
    symbol: "NVDA",
    expected_summary: "Ambiguous Sector Theme -> Asks ticker (NVDA, AMD, SMH) & mode (Workflow/Trade/Alert)",
  },
  {
    id: "cf_4",
    category: "ASK_USER_CONFIRMATION",
    category_label: "4. Ask Confirmation",
    query: "Hedge my tech portfolio against a Middle East oil spike.",
    short_label: "Hedge my tech portfolio against a Middle East oil spike.",
    auto_platform_id: "plat_ibkr",
    symbol: "GLD",
    expected_summary: "Multi-Instrument Hedge -> Presents Gold (GLD), Oil (USO), & Event Hedge options",
  },
  {
    id: "cf_5",
    category: "ASK_USER_CONFIRMATION",
    category_label: "4. Ask Confirmation",
    query: "What's the best way to trade the upcoming NVDA earnings call?",
    short_label: "What's the best way to trade the upcoming NVDA earnings call?",
    auto_platform_id: "plat_alpaca",
    symbol: "NVDA",
    expected_summary: "Strategy Comparison -> Presents Post-Earnings Workflow vs Pre-Earnings Buy vs Alert",
  },
  {
    id: "cf_6",
    category: "ASK_USER_CONFIRMATION",
    category_label: "4. Ask Confirmation",
    query: "Put some money into crypto when the market dips.",
    short_label: "Put some money into crypto when the market dips.",
    auto_platform_id: "plat_hyperliquid",
    symbol: "ETH-PERP",
    expected_summary: "Missing Asset & Dip % -> Presents 1-click Asset (ETH/BTC/SOL), Dip %, & Size pills",
  },
];

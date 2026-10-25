import {
  ActiveStrategyState,
  ActivityReceiptRecord,
  AssetClass,
  CompileQueryResponse,
  ConfirmationPromptPayload,
  DirectTradeTicketSpec,
  MarketNewsArticle,
  NewsCategory,
  NoticeChannel,
  PlatformExecutionRoute,
  PortfolioSummaryState,
  SentimentLabel,
  SignalNodeSpec,
  SmartNoticeDiagramSpec,
  ThinkingStep,
  TradeActionNodeSpec,
  TradeSide,
  TriggerNodeSpec,
  WorkflowBranchPathSpec,
  WorkflowDiagramSpec,
} from "./tipping-point-types";
import {
  PLATFORM_REGISTRY,
  autoSelectPlatform,
  getCompatiblePlatforms,
  listAllPlatforms,
} from "./platform-registry";

const MARKET_QUOTES: Record<
  string,
  { name: string; asset_class: AssetClass; price: string; change_pct: string }
> = {
  NVDA: { name: "NVIDIA Corp.", asset_class: "EQUITY", price: "211.11", change_pct: "+4.16%" },
  DELL: { name: "Dell Technologies Inc.", asset_class: "EQUITY", price: "456.44", change_pct: "+0.70%" },
  AMD: { name: "Advanced Micro Devices", asset_class: "EQUITY", price: "168.40", change_pct: "+2.85%" },
  TSLA: { name: "Tesla, Inc.", asset_class: "EQUITY", price: "248.90", change_pct: "-1.42%" },
  AAPL: { name: "Apple Inc.", asset_class: "EQUITY", price: "234.15", change_pct: "+0.92%" },
  MSFT: { name: "Microsoft Corp.", asset_class: "EQUITY", price: "442.50", change_pct: "+1.24%" },
  META: { name: "Meta Platforms, Inc.", asset_class: "EQUITY", price: "596.30", change_pct: "+2.10%" },
  GOOGL: { name: "Alphabet Inc.", asset_class: "EQUITY", price: "186.40", change_pct: "+1.15%" },
  AMZN: { name: "Amazon.com, Inc.", asset_class: "EQUITY", price: "212.75", change_pct: "+1.68%" },
  PLTR: { name: "Palantir Technologies", asset_class: "EQUITY", price: "64.20", change_pct: "+5.12%" },
  COIN: { name: "Coinbase Global, Inc.", asset_class: "EQUITY", price: "298.40", change_pct: "+4.80%" },
  MSTR: { name: "MicroStrategy Inc.", asset_class: "EQUITY", price: "385.00", change_pct: "+6.40%" },
  DJT: { name: "Trump Media & Technology", asset_class: "EQUITY", price: "34.50", change_pct: "+7.80%" },
  INTC: { name: "Intel Corporation", asset_class: "EQUITY", price: "24.85", change_pct: "-0.85%" },
  AVGO: { name: "Broadcom Inc.", asset_class: "EQUITY", price: "182.90", change_pct: "+2.95%" },
  TSM: { name: "Taiwan Semiconductor", asset_class: "EQUITY", price: "194.60", change_pct: "+3.20%" },
  ORCL: { name: "Oracle Corporation", asset_class: "EQUITY", price: "178.30", change_pct: "+1.90%" },
  SMCI: { name: "Super Micro Computer", asset_class: "EQUITY", price: "42.10", change_pct: "+4.30%" },
  XOM: { name: "Exxon Mobil Corp.", asset_class: "EQUITY", price: "118.60", change_pct: "+2.85%" },
  CVX: { name: "Chevron Corp.", asset_class: "EQUITY", price: "156.40", change_pct: "+2.30%" },
  OXY: { name: "Occidental Petroleum", asset_class: "EQUITY", price: "54.80", change_pct: "+3.15%" },
  XLE: { name: "Energy Select Sector SPDR", asset_class: "ETF", price: "92.30", change_pct: "+2.65%" },
  SCO: { name: "ProShares UltraShort Bloomberg Crude Oil", asset_class: "ETF", price: "18.90", change_pct: "-4.60%" },
  SPY: { name: "SPDR S&P 500 ETF", asset_class: "ETF", price: "584.20", change_pct: "+0.64%" },
  QQQ: { name: "Invesco QQQ Trust", asset_class: "ETF", price: "502.80", change_pct: "+1.18%" },
  SMH: { name: "VanEck Semiconductor ETF", asset_class: "ETF", price: "262.35", change_pct: "+3.10%" },
  GLD: { name: "SPDR Gold Trust", asset_class: "ETF", price: "254.60", change_pct: "+1.55%" },
  USO: { name: "United States Oil Fund", asset_class: "ETF", price: "78.45", change_pct: "+2.40%" },
  TLT: { name: "iShares 20+ Year Treasury ETF", asset_class: "ETF", price: "94.80", change_pct: "+1.12%" },
  "BTC-USD": { name: "Bitcoin Spot", asset_class: "CRYPTO_SPOT", price: "91420.00", change_pct: "+3.84%" },
  "ETH-USD": { name: "Ethereum Spot", asset_class: "CRYPTO_SPOT", price: "3240.00", change_pct: "+2.65%" },
  "SOL-USD": { name: "Solana Spot", asset_class: "CRYPTO_SPOT", price: "214.50", change_pct: "+5.35%" },
  "DOGE-USD": { name: "Dogecoin Spot", asset_class: "CRYPTO_SPOT", price: "0.38", change_pct: "+8.20%" },
  "PAXG-USD": { name: "PAX Gold Commodity Token", asset_class: "CRYPTO_SPOT", price: "2745.00", change_pct: "+1.85%" },
  "POWR-USD": { name: "Powerledger Energy Token", asset_class: "CRYPTO_SPOT", price: "0.34", change_pct: "+6.40%" },
  "ONDO-USD": { name: "Ondo RWA Yield Token", asset_class: "CRYPTO_SPOT", price: "1.18", change_pct: "+4.20%" },
  "RENDER-USD": { name: "Render AI Compute Token", asset_class: "CRYPTO_SPOT", price: "7.85", change_pct: "+5.60%" },
  "FET-USD": { name: "Artificial Superintelligence Token", asset_class: "CRYPTO_SPOT", price: "1.64", change_pct: "+6.10%" },
  "OIL-PERP": { name: "WTI Crude Oil Perpetual", asset_class: "PERP", price: "74.80", change_pct: "+3.10%" },
  "BTC-PERP": { name: "Bitcoin Perpetual", asset_class: "PERP", price: "91450.00", change_pct: "+3.88%" },
  "ETH-PERP": { name: "Ethereum Perpetual", asset_class: "PERP", price: "3242.50", change_pct: "+2.71%" },
  "SOL-PERP": { name: "Solana Perpetual", asset_class: "PERP", price: "214.80", change_pct: "+5.40%" },
  "WETH-USDC": { name: "Wrapped Ether / USDC Pool", asset_class: "DEFI_SWAP", price: "3240.00", change_pct: "+2.65%" },
  "PAXG-USDC": { name: "PAX Gold / USDC Onchain Pool", asset_class: "DEFI_SWAP", price: "2745.00", change_pct: "+1.85%" },
  "MIDEAST-OIL-YES": {
    name: "WTI Crude Oil > $90 / Escalation (YES)",
    asset_class: "PREDICTION",
    price: "0.42",
    change_pct: "+8.50%",
  },
  "KXOIL-WTI-90": {
    name: "Kalshi WTI Crude Oil > $90 (YES)",
    asset_class: "PREDICTION",
    price: "0.41",
    change_pct: "+7.90%",
  },
  "OIL-SPIKE-YES": {
    name: "ForecastEx Crude Oil Spike (YES)",
    asset_class: "PREDICTION",
    price: "0.44",
    change_pct: "+6.80%",
  },
  "FED-CUT-25BPS-YES": {
    name: "Fed 25bps Rate Cut (YES Share)",
    asset_class: "PREDICTION",
    price: "0.68",
    change_pct: "+6.25%",
  },
  "KXCPI-CORE": {
    name: "US Core CPI YoY < 2.5% (YES)",
    asset_class: "PREDICTION",
    price: "0.61",
    change_pct: "+4.10%",
  },
  "KXRECESSION-26": {
    name: "US Recession Event Contract",
    asset_class: "PREDICTION",
    price: "0.24",
    change_pct: "-3.20%",
  },
};

function shortHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0") + "9a4f2c1e";
}

function extractDollarAmount(query: string, defaultAmount = "500.00"): [string, boolean] {
  const m = query.match(/\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)/);
  if (m?.[1]) {
    const val = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isNaN(val) && val > 0) {
      return [val.toFixed(2), false];
    }
  }
  const mSwap = query.toLowerCase().match(/swap\s+([0-9][0-9,]*)\s+usdc/);
  if (mSwap?.[1]) {
    const val = parseFloat(mSwap[1].replace(/,/g, ""));
    if (!Number.isNaN(val) && val > 0) {
      return [val.toFixed(2), false];
    }
  }
  return [defaultAmount, true];
}

export function formatEstimatedUnits(notionalUsd: string, priceStr: string, symbol: string): string {
  const notional = parseFloat(notionalUsd.replace(/,/g, ""));
  const price = parseFloat(priceStr.replace(/,/g, ""));
  if (Number.isNaN(notional) || Number.isNaN(price) || price <= 0) {
    return "2.37 shares";
  }
  const units = notional / price;
  if (symbol.includes("YES") || symbol.includes("NO") || symbol.startsWith("KX")) {
    return `${units.toFixed(1)} YES shares`;
  }
  if (["BTC", "ETH", "WETH"].some((c) => symbol.includes(c))) {
    return `${units.toFixed(4)} ${symbol.split("-")[0]}`;
  }
  if (symbol.includes("PERP")) {
    return `${units.toFixed(2)} contracts`;
  }
  return `${units.toFixed(2)} shares`;
}

function detectAssetAndClass(query: string): [string, string, AssetClass] {
  const q = query.toLowerCase();
  if (q.includes("weth") || (q.includes("swap") && q.includes("usdc"))) {
    return ["WETH-USDC", "Wrapped Ether / USDC Pool", "DEFI_SWAP"];
  }
  if (q.includes("sol-perp") || (q.includes("sol") && (q.includes("long") || q.includes("perp")))) {
    return ["SOL-PERP", "Solana Perpetual", "PERP"];
  }
  if (
    q.includes("eth") &&
    (q.includes("leverage") || q.includes("perp") || q.includes("funding") || q.includes("long"))
  ) {
    return ["ETH-PERP", "Ethereum Perpetual", "PERP"];
  }
  if (q.includes("eth")) {
    return ["ETH-USD", "Ethereum Spot", "CRYPTO_SPOT"];
  }
  if (q.includes("btc") || q.includes("bitcoin")) {
    return ["BTC-USD", "Bitcoin Spot", "CRYPTO_SPOT"];
  }
  if (q.includes("recession")) {
    return ["KXRECESSION-26", "US Recession Event Contract", "PREDICTION"];
  }
  if (q.includes("fed") || q.includes("rate cut") || q.includes("25bps")) {
    return ["FED-CUT-25BPS-YES", "Fed 25bps Rate Cut (YES Share)", "PREDICTION"];
  }
  if (q.includes("cpi")) {
    return ["KXCPI-CORE", "US Core CPI YoY < 2.5% (YES)", "PREDICTION"];
  }
  if (q.includes("gold") || q.includes("gld")) {
    return ["GLD", "SPDR Gold Trust", "ETF"];
  }
  if (/\bspy\b/i.test(q) || q.includes("s&p 500") || q.includes("s&p500")) {
    return ["SPY", "SPDR S&P 500 ETF Trust", "ETF"];
  }
  if (/\bqqq\b/i.test(q) || q.includes("nasdaq 100")) {
    return ["QQQ", "Invesco QQQ Trust", "ETF"];
  }
  if (/\biwm\b/i.test(q) || q.includes("russell 2000")) {
    return ["IWM", "iShares Russell 2000 ETF", "ETF"];
  }
  if (/\btlt\b/i.test(q) || q.includes("treasury")) {
    return ["TLT", "iShares 20+ Year Treasury Bond ETF", "ETF"];
  }
  if (/\bsmh\b/i.test(q)) {
    return ["SMH", "VanEck Semiconductor ETF", "ETF"];
  }
  if (
    ["oil", "crude", "energy", "xom", "exxon", "cvx", "chevron", "oxy", "uso"].some((w) =>
      q.includes(w)
    )
  ) {
    if (q.includes("uso")) return ["USO", "United States Oil Fund", "ETF"];
    if (q.includes("cvx") || q.includes("chevron")) return ["CVX", "Chevron Corp.", "EQUITY"];
    if (q.includes("oxy") || q.includes("occidental")) return ["OXY", "Occidental Petroleum", "EQUITY"];
    return ["XOM", "Exxon Mobil Corp.", "EQUITY"];
  }
  if (q.includes("dell")) {
    return ["DELL", "Dell Technologies Inc.", "EQUITY"];
  }
  if (q.includes("djt") || q.includes("trump media")) {
    return ["DJT", "Trump Media & Technology", "EQUITY"];
  }
  if (q.includes("tsla") || q.includes("tesla") || q.includes("ev delivery")) {
    return ["TSLA", "Tesla, Inc.", "EQUITY"];
  }
  if (q.includes("aapl") || q.includes("apple")) {
    return ["AAPL", "Apple Inc.", "EQUITY"];
  }
  if (q.includes("msft") || q.includes("microsoft")) {
    return ["MSFT", "Microsoft Corp.", "EQUITY"];
  }
  if (q.includes("meta") || q.includes("facebook")) {
    return ["META", "Meta Platforms, Inc.", "EQUITY"];
  }
  if (q.includes("goog") || q.includes("alphabet")) {
    return ["GOOGL", "Alphabet Inc.", "EQUITY"];
  }
  if (q.includes("amzn") || q.includes("amazon")) {
    return ["AMZN", "Amazon.com, Inc.", "EQUITY"];
  }
  if (q.includes("pltr") || q.includes("palantir")) {
    return ["PLTR", "Palantir Technologies", "EQUITY"];
  }
  if (q.includes("amd") && !q.includes("nvda")) {
    return ["AMD", "Advanced Micro Devices", "EQUITY"];
  }

  const stopwords = new Set([
    "BUY", "SELL", "LONG", "SHORT", "SWAP", "WHEN", "IF", "AND", "OR", "THE",
    "FOR", "WITH", "ON", "IN", "TO", "OF", "AT", "USD", "USDC", "YES", "NO",
    "ETF", "AI", "CPI", "FED", "US", "X", "CEO",
  ]);
  const matches = query.match(/\b[A-Z]{2,5}\b/g) || [];
  for (const tok of matches) {
    if (!stopwords.has(tok)) {
      const known = MARKET_QUOTES[tok];
      if (known) {
        return [tok, known.name, known.asset_class];
      }
      return [tok, `${tok} Corp.`, "EQUITY"];
    }
  }

  return ["NVDA", "NVIDIA Corp.", "EQUITY"];
}

export function buildAllPlatformExecutionRoutes(
  query: string,
  primarySymbol: string,
  primaryName: string,
  primaryClass: AssetClass,
  primarySide: TradeSide,
  notionalUsd: string,
  primaryPlatformId: string
): PlatformExecutionRoute[] {
  const q = query.toLowerCase();
  const isOilOrWarTheme =
    [
      "oil",
      "crude",
      "energy",
      "war",
      "iran",
      "starting star",
      "starting war",
      "middle east",
      "xom",
      "uso",
      "cvx",
      "oxy",
      "sco",
    ].some((w) => q.includes(w)) ||
    ["XOM", "USO", "CVX", "OXY", "XLE", "SCO", "OIL-PERP", "GLD"].includes(primarySymbol);
  const isShort = primarySide.includes("SHORT");
  const isSell = primarySide.includes("SELL") || isShort || primarySide === "BUY NO";

  type RouteTuple = [string, string, string, AssetClass, string, TradeSide];
  let specs: RouteTuple[] = [];

  if (isOilOrWarTheme && isSell) {
    specs = [
      ["plat_hyperliquid", "OIL-PERP", "WTI Crude Oil Perpetual", "PERP", "Short Crude Perp", "SHORT 2x"],
      ["plat_alpaca", "USO", "United States Oil Fund", "ETF", "Short Oil ETF", "SHORT"],
      ["plat_ibkr", "SCO", "ProShares UltraShort Crude Oil", "ETF", "2x Inverse Oil ETF", "BUY"],
      ["plat_dydx", "OIL-PERP", "WTI Crude Oil Perpetual", "PERP", "Short Crude Perp", "SHORT 2x"],
      ["plat_polymarket", "MIDEAST-OIL-YES", "WTI Crude > $90 / Iran War NO", "PREDICTION", "Event Contract NO", "BUY NO"],
      ["plat_robinhood", "CVX", "Chevron Corp.", "EQUITY", "Sell / Short Oil Stock", "SELL"],
      ["plat_schwab", "SCO", "ProShares UltraShort Crude Oil", "ETF", "2x Inverse Oil ETF", "BUY"],
      ["plat_tradier", "XLE", "Energy Select Sector SPDR", "ETF", "Short Energy ETF", "SHORT"],
      ["plat_bybit", "OIL-PERP", "WTI Crude Oil Linear Perp", "PERP", "Short Crude Perp", "SHORT 2x"],
      ["plat_kalshi", "KXOIL-WTI-90", "Kalshi WTI Crude > $90 NO", "PREDICTION", "CFTC Contract NO", "BUY NO"],
      ["plat_forecastex", "OIL-SPIKE-YES", "ForecastEx Crude Oil Spike NO", "PREDICTION", "Forecast Contract NO", "BUY NO"],
      ["plat_coinbase", "PAXG-USD", "PAX Gold Commodity Token", "CRYPTO_SPOT", "Sell Commodity Token", "SELL"],
      ["plat_binance", "POWR-USD", "Powerledger Energy Token", "CRYPTO_SPOT", "Short Energy Token", "SELL"],
      ["plat_kraken", "PAXG-USD", "PAX Gold Commodity Token", "CRYPTO_SPOT", "Sell Commodity Token", "SELL"],
      ["plat_okx", "ONDO-USD", "Ondo RWA Treasury Token", "CRYPTO_SPOT", "Sell RWA Token", "SELL"],
      ["plat_uniswap", "PAXG-USDC", "Swap PAXG -> USDC Stable", "DEFI_SWAP", "DeFi Exit Swap", "SWAP"],
    ];
  } else if (isOilOrWarTheme) {
    specs = [
      ["plat_alpaca", "XOM", "Exxon Mobil Corp.", "EQUITY", "Oil Stock", "BUY"],
      ["plat_coinbase", "PAXG-USD", "PAX Gold Commodity Token", "CRYPTO_SPOT", "Commodity Token", "BUY"],
      ["plat_hyperliquid", "OIL-PERP", "WTI Crude Oil Perpetual", "PERP", "Crude Oil Perp", "LONG 2x"],
      ["plat_ibkr", "USO", "United States Oil Fund", "ETF", "Crude Oil ETF", "BUY"],
      ["plat_binance", "POWR-USD", "Powerledger Energy Token", "CRYPTO_SPOT", "Energy Token", "BUY"],
      ["plat_uniswap", "PAXG-USDC", "PAX Gold / USDC Pool", "DEFI_SWAP", "Onchain Token Swap", "SWAP"],
      ["plat_polymarket", "MIDEAST-OIL-YES", "WTI Crude > $90 / Escalation YES", "PREDICTION", "Event Contract", "BUY YES"],
      ["plat_robinhood", "CVX", "Chevron Corp.", "EQUITY", "Oil Stock", "BUY"],
      ["plat_kraken", "BTC-USD", "Bitcoin Digital Reserve Token", "CRYPTO_SPOT", "Macro Token", "BUY"],
      ["plat_schwab", "OXY", "Occidental Petroleum", "EQUITY", "Oil Stock", "BUY"],
      ["plat_okx", "ONDO-USD", "Ondo RWA Treasury Token", "CRYPTO_SPOT", "RWA Token", "BUY"],
      ["plat_dydx", "BTC-PERP", "Bitcoin Macro Perpetual", "PERP", "Macro Perp", "LONG 2x"],
      ["plat_tradier", "XLE", "Energy Select Sector SPDR", "ETF", "Energy ETF", "BUY"],
      ["plat_bybit", "PAXG-USD", "PAX Gold Commodity Token", "CRYPTO_SPOT", "Commodity Token", "BUY"],
      ["plat_kalshi", "KXOIL-WTI-90", "Kalshi WTI Crude > $90 YES", "PREDICTION", "CFTC Event Contract", "BUY YES"],
      ["plat_forecastex", "OIL-SPIKE-YES", "ForecastEx Crude Oil Spike YES", "PREDICTION", "Forecast Contract", "BUY YES"],
    ];
  } else if (primaryClass === "EQUITY" || primaryClass === "ETF") {
    const eqLabel = primaryClass === "ETF" ? "ETF" : "Stock";
    const eqSide: TradeSide = isShort ? "SHORT" : isSell ? "SELL" : "BUY";
    const perpSide: TradeSide = isSell ? "SHORT 2x" : "LONG 2x";
    const predSide: TradeSide = isSell ? "BUY NO" : "BUY YES";
    const tokSide: TradeSide = isSell ? "SELL" : "BUY";
    specs = [
      ["plat_alpaca", primarySymbol, primaryName, primaryClass, eqLabel, eqSide],
      ["plat_ibkr", primarySymbol, primaryName, primaryClass, eqLabel, eqSide],
      ["plat_robinhood", primarySymbol, primaryName, primaryClass, eqLabel, eqSide],
      ["plat_schwab", primarySymbol, primaryName, primaryClass, eqLabel, eqSide],
      ["plat_tradier", primarySymbol, primaryName, primaryClass, eqLabel, eqSide],
      ["plat_coinbase", "RENDER-USD", "Render AI Compute Token", "CRYPTO_SPOT", "AI & Tech Token", tokSide],
      ["plat_binance", "FET-USD", "Artificial Superintelligence Token", "CRYPTO_SPOT", "AI Token", tokSide],
      ["plat_hyperliquid", "ETH-PERP", "Ethereum Perpetual", "PERP", "Onchain Perp", perpSide],
      ["plat_kraken", "BTC-USD", "Bitcoin Spot Token", "CRYPTO_SPOT", "Spot Token", tokSide],
      ["plat_okx", "SOL-USD", "Solana Spot Token", "CRYPTO_SPOT", "Spot Token", tokSide],
      ["plat_bybit", "BTC-USD", "Bitcoin Spot Token", "CRYPTO_SPOT", "Spot Token", tokSide],
      ["plat_dydx", "SOL-PERP", "Solana Perpetual", "PERP", "Onchain Perp", perpSide],
      ["plat_uniswap", "WETH-USDC", "Wrapped Ether / USDC Pool", "DEFI_SWAP", "Onchain Token Swap", "SWAP"],
      ["plat_polymarket", "FED-CUT-25BPS-YES", "Macro Tech Catalyst", "PREDICTION", "Event Contract", predSide],
      ["plat_kalshi", "KXCPI-CORE", "US Core CPI < 2.5%", "PREDICTION", "CFTC Event Contract", predSide],
      ["plat_forecastex", "KXRECESSION-26", "US Macro Growth Contract", "PREDICTION", "Forecast Contract", predSide],
    ];
  } else if (primaryClass === "CRYPTO_SPOT" || primaryClass === "PERP" || primaryClass === "DEFI_SWAP") {
    const baseSpot = primaryClass === "CRYPTO_SPOT" ? primarySymbol : "BTC-USD";
    const baseSpotName = primaryClass === "CRYPTO_SPOT" ? primaryName : "Bitcoin Spot";
    const basePerp = primaryClass === "PERP" ? primarySymbol : "ETH-PERP";
    const basePerpName = primaryClass === "PERP" ? primaryName : "Ethereum Perpetual";
    specs = [
      ["plat_coinbase", baseSpot, baseSpotName, "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_binance", baseSpot, baseSpotName, "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_kraken", baseSpot, baseSpotName, "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_okx", baseSpot, baseSpotName, "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_bybit", baseSpot, baseSpotName, "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_hyperliquid", basePerp, basePerpName, "PERP", "Onchain Perp", primarySide.includes("3x") ? "LONG 3x" : "LONG 2x"],
      ["plat_dydx", basePerp, basePerpName, "PERP", "Onchain Perp", "LONG 2x"],
      ["plat_uniswap", "WETH-USDC", "Wrapped Ether / USDC Pool", "DEFI_SWAP", "Onchain Token Swap", "SWAP"],
      ["plat_robinhood", baseSpot, baseSpotName, "CRYPTO_SPOT", "Retail Crypto", "BUY"],
      ["plat_alpaca", baseSpot, baseSpotName, "CRYPTO_SPOT", "Brokerage Crypto", "BUY"],
      ["plat_ibkr", "COIN", "Coinbase Global, Inc.", "EQUITY", "Crypto Proxy Stock", "BUY"],
      ["plat_schwab", "MSTR", "MicroStrategy Inc.", "EQUITY", "BTC Treasury Stock", "BUY"],
      ["plat_tradier", "COIN", "Coinbase Global, Inc.", "EQUITY", "Crypto Proxy Stock", "BUY"],
      ["plat_polymarket", "FED-CUT-25BPS-YES", "Fed 25bps Rate Cut YES", "PREDICTION", "Event Contract", "BUY YES"],
      ["plat_kalshi", "KXCPI-CORE", "US Core CPI < 2.5% YES", "PREDICTION", "CFTC Event Contract", "BUY YES"],
      ["plat_forecastex", "KXRECESSION-26", "US Macro Event Contract", "PREDICTION", "Forecast Contract", "BUY YES"],
    ];
  } else {
    specs = [
      ["plat_polymarket", primarySymbol, primaryName, "PREDICTION", "Event Contract", "BUY YES"],
      ["plat_kalshi", "KXCPI-CORE", "US Core CPI YoY < 2.5% (YES)", "PREDICTION", "CFTC Event Contract", "BUY YES"],
      ["plat_forecastex", "KXRECESSION-26", "US Recession Event Contract", "PREDICTION", "Forecast Contract", "BUY YES"],
      ["plat_robinhood", primarySymbol, primaryName, "PREDICTION", "Event Contract", "BUY YES"],
      ["plat_alpaca", "SPY", "SPDR S&P 500 ETF", "ETF", "Macro ETF", "BUY"],
      ["plat_ibkr", "TLT", "iShares 20+ Year Treasury ETF", "ETF", "Rates ETF", "BUY"],
      ["plat_schwab", "QQQ", "Invesco QQQ Trust", "ETF", "Index ETF", "BUY"],
      ["plat_tradier", "SPY", "SPDR S&P 500 ETF", "ETF", "Macro ETF", "BUY"],
      ["plat_coinbase", "BTC-USD", "Bitcoin Spot", "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_binance", "BTC-USD", "Bitcoin Spot", "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_kraken", "ETH-USD", "Ethereum Spot", "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_okx", "BTC-USD", "Bitcoin Spot", "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_bybit", "BTC-USD", "Bitcoin Spot", "CRYPTO_SPOT", "Spot Token", "BUY"],
      ["plat_hyperliquid", "BTC-PERP", "Bitcoin Perpetual", "PERP", "Onchain Perp", "LONG 2x"],
      ["plat_dydx", "ETH-PERP", "Ethereum Perpetual", "PERP", "Onchain Perp", "LONG 2x"],
      ["plat_uniswap", "WETH-USDC", "Wrapped Ether / USDC Pool", "DEFI_SWAP", "Onchain Token Swap", "SWAP"],
    ];
  }

  const orderedSpecs = [...specs].sort((a, b) =>
    a[0] === primaryPlatformId ? -1 : b[0] === primaryPlatformId ? 1 : 0
  );

  const platformDefaultNotionals: Record<string, string> = {
    plat_alpaca: "500.00",
    plat_coinbase: "350.00",
    plat_hyperliquid: "1250.00",
    plat_ibkr: "1000.00",
    plat_polymarket: "250.00",
    plat_robinhood: "400.00",
    plat_binance: "600.00",
    plat_schwab: "1500.00",
    plat_dydx: "850.00",
    plat_kalshi: "200.00",
    plat_kraken: "450.00",
    plat_okx: "550.00",
    plat_bybit: "750.00",
    plat_tradier: "650.00",
    plat_uniswap: "300.00",
    plat_forecastex: "150.00",
  };

  return orderedSpecs.map(([pid, sym, name, cls, typeLabel, rSide]) => {
    const plat = PLATFORM_REGISTRY[pid] ?? PLATFORM_REGISTRY.plat_alpaca;
    const qInfo = MARKET_QUOTES[sym] ?? {
      name,
      asset_class: cls,
      price: "125.00",
      change_pct: "+1.85%",
    };
    const routeNotional =
      pid === primaryPlatformId && notionalUsd !== "500.00"
        ? notionalUsd
        : platformDefaultNotionals[pid] ?? notionalUsd;
    return {
      platform: plat,
      symbol: sym,
      asset_name: qInfo.name || name,
      asset_class: cls,
      asset_type_label: typeLabel,
      side: rSide,
      spot_price: qInfo.price,
      change_24h_pct: qInfo.change_pct,
      notional_usd: routeNotional,
      estimated_units: formatEstimatedUnits(routeNotional, qInfo.price, sym),
    };
  });
}

function splitConditionalClauses(query: string): string[] {
  const parts = query
    .trim()
    .split(/(?:,\s*|\s+and\s+|\s+or\s+|;\s*|\.\s+)(?=(?:if|when|whenever|otherwise|else)\b)/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts;
  const partsSpace = query
    .trim()
    .split(/\s+(?=(?:if|whenever)\s+(?:trump|elon|he|iran|war|peace|btc|bitcoin|eth|oil)\b)/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (partsSpace.length >= 2) return partsSpace;
  const partsAlt = query
    .trim()
    .split(/(?:,\s*|;\s*|\s+and\s+)(?=(?:short|sell|buy|long)\b.*\b(?:if|when|whenever)\b)/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return partsAlt.length >= 2 ? partsAlt : [query.trim()];
}

function buildMultiInputSignalsAndPaths(
  query: string,
  primarySignal: SignalNodeSpec,
  primaryTrigger: TriggerNodeSpec,
  primaryAction: TradeActionNodeSpec,
  notionalUsd: string,
  smartDefaultUsed: boolean,
  overridePlatformId?: string
): [SignalNodeSpec[], WorkflowBranchPathSpec[]] {
  const qLower = query.toLowerCase();
  const clauses = splitConditionalClauses(query);
  const isOilWar = [
    "oil",
    "war",
    "iran",
    "starting star",
    "starting war",
    "crude",
    "middle east",
  ].some((w) => qLower.includes(w));
  const hasSocialX = [
    "twitter",
    "tweet",
    "twitt",
    "x.com",
    " on x",
    "truth social",
    "elon",
    "trump",
  ].some((w) => qLower.includes(w));

  const hasPriceOrTech = [
    "breaks above",
    "rises 1.5%",
    "falls 4%",
    "drops 5%",
    "above $",
    "below $",
    "moving average",
    "200-day",
    "200 day",
    "50-day",
    "50 day",
    "sma",
    "ema",
    "rsi",
    "price",
  ].some((k) => qLower.includes(k));
  const hasBothPriceAndNews =
    hasPriceOrTech &&
    ["news", "inflow", "sentiment", "tension", "trump", "tweet", "war", "iran"].some((w) =>
      qLower.includes(w)
    );

  let signals: SignalNodeSpec[];
  if (isOilWar && clauses.length >= 2 && !hasPriceOrTech) {
    signals = [
      {
        node_id: "sig_01",
        price_source_label: "Live Market Price",
        symbol: "XOM",
        asset_name: "Exxon Mobil & Crude Oil Universe",
        asset_class: "EQUITY",
        spot_price: MARKET_QUOTES.XOM.price,
        change_24h_pct: MARKET_QUOTES.XOM.change_pct,
        news_feed_label: hasSocialX ? "X (Twitter) & Social Stream" : "Geopolitical Social Stream",
        news_topic: "Donald Trump (@realDonaldTrump) War & Iran Diplomacy Mentions",
        sentiment_state: "High-Impact Catalyst",
        schedule_cadence: "Real-Time Streaming (<= 15s Freshness)",
      },
    ];
  } else if (isOilWar && clauses.length >= 2 && hasPriceOrTech) {
    signals = [
      {
        node_id: "sig_01",
        price_source_label: "Live Market Price",
        symbol: "XOM",
        asset_name: "Exxon Mobil & Crude Oil Universe",
        asset_class: "EQUITY",
        spot_price: MARKET_QUOTES.XOM.price,
        change_24h_pct: MARKET_QUOTES.XOM.change_pct,
        news_feed_label: hasSocialX ? "X (Twitter) & Social Stream" : "Geopolitical Social Stream",
        news_topic: "Donald Trump (@realDonaldTrump) War & Iran Diplomacy Mentions",
        sentiment_state: "High-Impact Catalyst",
        schedule_cadence: "Real-Time Streaming (<= 15s Freshness)",
      },
      {
        node_id: "sig_02",
        price_source_label: "Live Market Price",
        symbol: "USO",
        asset_name: "United States Oil Fund (WTI Crude ETF)",
        asset_class: "ETF",
        spot_price: MARKET_QUOTES.USO.price,
        change_24h_pct: MARKET_QUOTES.USO.change_pct,
        news_feed_label: "Stock Price & Technicals",
        news_topic: "USO / WTI Crude Price & 200-Day Moving Average (SMA 200)",
        sentiment_state: "Bullish",
        schedule_cadence: "Real-Time Streaming (<= 15s Freshness)",
      },
    ];
  } else if (hasBothPriceAndNews) {
    signals = [
      primarySignal,
      {
        node_id: "sig_02",
        price_source_label: "Live Market Price",
        symbol: primarySignal.symbol,
        asset_name: primarySignal.asset_name,
        asset_class: primarySignal.asset_class,
        spot_price: primarySignal.spot_price,
        change_24h_pct: primarySignal.change_24h_pct,
        news_feed_label: "Live Market Price",
        news_topic: `${primarySignal.symbol} Real-Time Spot Price ($${primarySignal.spot_price})`,
        sentiment_state: primarySignal.sentiment_state,
        schedule_cadence: "Real-Time Streaming (<= 15s Freshness)",
      },
    ];
  } else {
    signals = [primarySignal];
  }

  const signalIds = signals.map((s) => s.node_id);

  if (clauses.length < 2) {
    const polarity =
      primaryAction.side.includes("SELL") ||
      primaryAction.side.includes("SHORT") ||
      primaryAction.side === "BUY NO"
        ? "BEARISH_SHORT"
        : "BULLISH_LONG";
    return [
      signals,
      [
        {
          path_id: "path_01",
          path_label: `Path A · ${primaryTrigger.headline_condition} → ${primaryAction.side} ${primaryAction.symbol}`,
          branch_polarity: polarity,
          connected_signal_ids: signalIds,
          trigger: primaryTrigger,
          action: primaryAction,
        },
      ],
    ];
  }

  const paths: WorkflowBranchPathSpec[] = clauses.map((clText, idx) => {
    const clLower = clText.toLowerCase();
    const letter = String.fromCharCode(65 + idx);
    const isShortClause =
      [
        "short",
        "shorting",
        "sell",
        "selling",
        "buy no",
        "inverse",
        "stoping a war",
        "stopping a war",
        "stop a war",
        "ending a war",
        "peace",
        "ceasefire",
      ].some((w) => clLower.includes(w)) &&
      !(clLower.includes("buy oil") && !clLower.includes("short"));

    if (isOilWar && isShortClause) {
      const bPlat =
        overridePlatformId && PLATFORM_REGISTRY[overridePlatformId]
          ? PLATFORM_REGISTRY[overridePlatformId]
          : PLATFORM_REGISTRY.plat_hyperliquid;
      const bRoutes = buildAllPlatformExecutionRoutes(
        clText,
        "OIL-PERP",
        "WTI Crude Oil Perpetual",
        "PERP",
        "SHORT 2x",
        notionalUsd,
        bPlat.platform_id
      );
      const bTop = bRoutes[0];
      const bCond =
        clLower.includes("iran") || clLower.includes("stop")
          ? "Signal Output = Negative (−): Stopping a War in Iran"
          : "Signal Output = Negative (−): De-Escalation or Peace";
      return {
        path_id: `path_0${idx + 1}`,
        path_label: "Stopping War in Iran → Short Oil",
        branch_polarity: "BEARISH_SHORT",
        connected_signal_ids: signalIds,
        trigger: {
          node_id: `trg_0${idx + 2}`,
          headline_condition: bCond,
          operator_label: "Real-Time Check",
          clauses: [
            "Triggered when Signal Block emits Negative (−) output (stopping a war in Iran, ceasefire, or peace deal)",
            "Execute multi-venue short oil & inverse ETF orders within 5 minutes of detection",
          ],
          evaluation_mode: "State Crossing",
          hysteresis_buffer: "0.25%",
          cooldown_window: "15m",
          missing_data_policy: "Emit Unknown (Never Trigger on Stale Data)",
        },
        action: {
          node_id: `act_0${idx + 3}`,
          action_type: "TRADE_ORDER",
          platform: bTop.platform,
          compatible_platforms: bRoutes.map((r) => r.platform),
          execution_routes: bRoutes,
          side: bTop.side,
          symbol: bTop.symbol,
          asset_name: bTop.asset_name,
          order_type: "Market (Collar <= 35 bps)",
          notional_usd: bTop.notional_usd,
          estimated_units: bTop.estimated_units,
          smart_default_applied: smartDefaultUsed,
          take_profit_pct: "+20.0% (Short Target)",
          stop_loss_pct: "-5.0% (Short Cover)",
          position_policy: "Enter Only If Flat (Max 1 Open Leg)",
        },
      };
    }

    if (isOilWar) {
      const bPlat =
        overridePlatformId && PLATFORM_REGISTRY[overridePlatformId]
          ? PLATFORM_REGISTRY[overridePlatformId]
          : PLATFORM_REGISTRY.plat_alpaca;
      const bRoutes = buildAllPlatformExecutionRoutes(
        clText,
        "XOM",
        "Exxon Mobil Corp.",
        "EQUITY",
        "BUY",
        notionalUsd,
        bPlat.platform_id
      );
      const bTop = bRoutes[0];
      return {
        path_id: `path_0${idx + 1}`,
        path_label: "Starting a War → Buy Oil Stocks & Tokens",
        branch_polarity: "BULLISH_LONG",
        connected_signal_ids: signalIds,
        trigger: {
          node_id: `trg_0${idx + 2}`,
          headline_condition:
            "Signal Output = Positive (+): Starting a War",
          operator_label: "Real-Time Check",
          clauses: [
            "Triggered when Signal Block emits Positive (+) output (starting a war or military escalation)",
            "Execute multi-venue buy orders across oil stocks & tokens within 5 minutes of detection",
          ],
          evaluation_mode: "State Crossing",
          hysteresis_buffer: "0.25%",
          cooldown_window: "15m",
          missing_data_policy: "Emit Unknown (Never Trigger on Stale Data)",
        },
        action: {
          node_id: `act_0${idx + 3}`,
          action_type: "TRADE_ORDER",
          platform: bTop.platform,
          compatible_platforms: bRoutes.map((r) => r.platform),
          execution_routes: bRoutes,
          side: bTop.side,
          symbol: bTop.symbol,
          asset_name: bTop.asset_name,
          order_type: "Market (Collar <= 35 bps)",
          notional_usd: bTop.notional_usd,
          estimated_units: bTop.estimated_units,
          smart_default_applied: smartDefaultUsed,
          take_profit_pct: "+18.0%",
          stop_loss_pct: "-5.0%",
          position_policy: "Enter Only If Flat (Max 1 Open Leg)",
        },
      };
    }

    let [bSym, bName, bCls] = detectAssetAndClass(clText);
    if (bSym === "NVDA" && !clLower.includes("nvda") && !clLower.includes("nvidia")) {
      bSym = primarySignal.symbol;
      bName = primarySignal.asset_name;
      bCls = primarySignal.asset_class;
    }
    const bSide: TradeSide = isShortClause ? "SHORT" : "BUY";
    const bPlat =
      overridePlatformId && PLATFORM_REGISTRY[overridePlatformId]
        ? PLATFORM_REGISTRY[overridePlatformId]
        : autoSelectPlatform(bSym, bCls, clText);
    const bRoutes = buildAllPlatformExecutionRoutes(
      clText,
      bSym,
      bName,
      bCls,
      bSide,
      notionalUsd,
      bPlat.platform_id
    );
    const bTop = bRoutes[0];
    const bCond = clText.charAt(0).toUpperCase() + clText.slice(1);
    return {
      path_id: `path_0${idx + 1}`,
      path_label: `${bCond} → ${bTop.side} ${bTop.symbol}`,
      branch_polarity: isShortClause ? "BEARISH_SHORT" : "BULLISH_LONG",
      connected_signal_ids: signalIds,
      trigger: {
        node_id: `trg_0${idx + 2}`,
        headline_condition: bCond,
        operator_label: "Real-Time Check",
        clauses: [
          `Trigger Condition: ${bCond}`,
          `Route across ${bRoutes.length} connected platforms (Primary: ${bTop.platform.short_name} ${bTop.side} ${bTop.symbol})`,
        ],
        evaluation_mode: "State Crossing",
        hysteresis_buffer: "0.25%",
        cooldown_window: "15m",
        missing_data_policy: "Emit Unknown (Never Trigger on Stale Data)",
      },
      action: {
        node_id: `act_0${idx + 3}`,
        action_type: "TRADE_ORDER",
        platform: bTop.platform,
        compatible_platforms: bRoutes.map((r) => r.platform),
        execution_routes: bRoutes,
        side: bTop.side,
        symbol: bTop.symbol,
        asset_name: bTop.asset_name,
        order_type: "Market (Collar <= 35 bps)",
        notional_usd: bTop.notional_usd,
        estimated_units: bTop.estimated_units,
        smart_default_applied: smartDefaultUsed,
        take_profit_pct: isShortClause ? "+18.0% (Short Target)" : "+15.0%",
        stop_loss_pct: isShortClause ? "-5.0% (Short Cover)" : "-5.0%",
        position_policy: "Enter Only If Flat (Max 1 Open Leg)",
      },
    };
  });

  return [signals, paths];
}

function isVagueOrExploratoryQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  const vaguePatterns = [
    "how would",
    "what happens if",
    "what can i do",
    "make a play on",
    "help me set something up",
    "look super strong lately",
    "hedge my tech portfolio",
    "what's the best way to trade",
    "what is the best way to trade",
    "put some money into crypto",
    "what should i trade",
  ];
  return vaguePatterns.some((pat) => q.includes(pat));
}

function isNotificationQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  return [
    "notify me",
    "alert me",
    "ping me",
    "send me an email",
    "watch ",
    "let me know when",
    "message me",
  ].some((k) => q.includes(k));
}

function isDirectTradeQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (["when ", "whenever ", "if "].some((w) => q.includes(w))) {
    return false;
  }
  return [
    "right now",
    "at market",
    "market buy",
    "limit price",
    "open a ",
    "swap ",
    "buy now",
    "sell now",
  ].some((k) => q.includes(k));
}

function buildVagueConfirmationPayload(query: string): [ConfirmationPromptPayload, string] {
  const q = query.toLowerCase();

  if (q.includes("fed") && (q.includes("how would") || q.includes("bitcoin") || q.includes("prediction"))) {
    return [
      {
        scenario_title: "Open-Ended Macro & Cross-Market Question",
        why_confirmation_needed:
          "Your question explores macro rate-cut impacts across Prediction Markets and Crypto, so Tipping Point synthesized the live market impact below. Click any option to immediately generate the diagram:",
        market_synthesis_summary:
          "A surprise 25–50 bps Federal Reserve rate cut lowers real Treasury yields, immediately repricing rate-cut YES contracts toward 95¢+ and driving high-beta spot inflows into Bitcoin (+3.8% historical 24h median).",
        live_context: [
          {
            label: "Fed 25bps Cut Odds",
            value: "68¢ (68% Implied)",
            platform_name: "Polymarket",
            logo_svg: "/assets/logos/polymarket.svg",
          },
          {
            label: "Bitcoin Spot Price",
            value: "$91,420 (+3.84%)",
            platform_name: "Coinbase",
            logo_svg: "/assets/logos/coinbase.svg",
          },
          {
            label: "Macro News Sentiment",
            value: "Bullish (Dovish Fed)",
            platform_name: "Kalshi",
            logo_svg: "/assets/logos/kalshi.svg",
          },
        ],
        slot_groups: [],
        proposals: [
          {
            option_id: "opt_fed_poly_wf",
            outcome_to_build: "STRATEGY_WORKFLOW",
            badge_label: "Option 1 · Trading Workflow (Recommended)",
            title: "Build Prediction Market Rate-Cut Workflow",
            description: "When Macro Fed News = Bullish -> BUY $300 YES (FED-CUT-25BPS) on Polymarket",
            follow_up_query: "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
            platform: PLATFORM_REGISTRY.plat_polymarket,
            symbol: "FED-CUT-25BPS-YES",
            default_notional_usd: "300.00",
            recommended: true,
          },
          {
            option_id: "opt_fed_btc_wf",
            outcome_to_build: "STRATEGY_WORKFLOW",
            badge_label: "Option 2 · Crypto Breakout Workflow",
            title: "Build Bitcoin Rate-Cut Breakout Workflow",
            description: "When Fed Rate News = Bullish & BTC > $95,000 -> BUY $1,000 BTC-USD on Coinbase",
            follow_up_query: "If Bitcoin breaks above $95,000 on positive ETF inflow news, buy $1,000 BTC",
            platform: PLATFORM_REGISTRY.plat_coinbase,
            symbol: "BTC-USD",
            default_notional_usd: "1000.00",
            recommended: false,
          },
          {
            option_id: "opt_fed_notice",
            outcome_to_build: "SMART_NOTICE",
            badge_label: "Option 3 · Smart Notification Only",
            title: "Set Fed Rate-Cut Odds Crossing Alert",
            description: "Ping me on Push + Webhook if Fed December rate cut probability crosses above 75%",
            follow_up_query: "Ping me if the Fed December rate cut probability crosses above 75%",
            platform: PLATFORM_REGISTRY.plat_kalshi,
            symbol: "KXFED-25BPS",
            default_notional_usd: "0.00",
            recommended: false,
          },
        ],
      },
      "plat_polymarket",
    ];
  }

  if (q.includes("cpi") || q.includes("inflation")) {
    return [
      {
        scenario_title: "Multi-Asset Macro Catalyst Play (US CPI Inflation Report)",
        why_confirmation_needed:
          "You mentioned wanting a play on tomorrow's CPI inflation report, which can be traded via CFTC Event Contracts, Rate-Sensitive Equities, or Crypto Perpetuals. Choose your preferred setup:",
        market_synthesis_summary:
          "Consensus Core CPI YoY is 2.5%. A cooler print (< 2.5%) historically triggers rallies in tech equities (QQQ/NVDA), Treasury bonds (TLT), and event contracts.",
        live_context: [
          {
            label: "Kalshi Core CPI < 2.5%",
            value: "61¢ (61% YES)",
            platform_name: "Kalshi",
            logo_svg: "/assets/logos/kalshi.svg",
          },
          {
            label: "QQQ / TLT Pre-Market",
            value: "$502.80 (+1.18%)",
            platform_name: "Alpaca",
            logo_svg: "/assets/logos/alpaca.svg",
          },
          {
            label: "ETH-PERP Funding",
            value: "+0.011% / 8h",
            platform_name: "Hyperliquid",
            logo_svg: "/assets/logos/hyperliquid.svg",
          },
        ],
        slot_groups: [],
        proposals: [
          {
            option_id: "opt_cpi_kalshi",
            outcome_to_build: "STRATEGY_WORKFLOW",
            badge_label: "Option 1 · Event Contract Workflow (Recommended)",
            title: "Trade CPI < 2.5% Event Contract Workflow",
            description: "If US CPI inflation comes in below 2.5% -> BUY $300 YES shares automatically",
            follow_up_query: "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
            platform: PLATFORM_REGISTRY.plat_kalshi,
            symbol: "KXCPI-CORE",
            default_notional_usd: "300.00",
            recommended: true,
          },
          {
            option_id: "opt_cpi_alpaca",
            outcome_to_build: "STRATEGY_WORKFLOW",
            badge_label: "Option 2 · Tech Equity Workflow",
            title: "Buy NVDA / QQQ on Cool CPI & Bullish News",
            description: "When CPI & AI News Sentiment = Bullish -> BUY $500 NVDA on Alpaca",
            follow_up_query: "Buy NVDA when AI news is bullish",
            platform: PLATFORM_REGISTRY.plat_alpaca,
            symbol: "NVDA",
            default_notional_usd: "500.00",
            recommended: false,
          },
          {
            option_id: "opt_cpi_perp",
            outcome_to_build: "DIRECT_ACTION",
            badge_label: "Option 3 · Direct Perp Position Now",
            title: "Open Pre-CPI 2x Long on SOL-PERP Now",
            description: "Immediate $1,500 2x Isolated Long on Hyperliquid with protective stop-loss",
            follow_up_query: "Open a $1,500 2x long on SOL-PERP right now",
            platform: PLATFORM_REGISTRY.plat_hyperliquid,
            symbol: "SOL-PERP",
            default_notional_usd: "1500.00",
            recommended: false,
          },
        ],
      },
      "plat_kalshi",
    ];
  }

  if (q.includes("ai chips") || q.includes("set something up")) {
    return [
      {
        scenario_title: "Sector Theme Disambiguation (AI Semiconductors)",
        why_confirmation_needed:
          "'AI chips' spans multiple semiconductor leaders (NVDA, AMD, SMH ETF) and action modes. Select your target ticker or click a pre-built setup below:",
        market_synthesis_summary:
          "Semiconductor momentum is led by NVIDIA ($211.11, +4.16%) and AMD ($168.40, +2.85%) on strong hyperscaler AI rack shipment news.",
        live_context: [
          {
            label: "NVDA Live Price",
            value: "$211.11 (+4.16%)",
            platform_name: "Alpaca",
            logo_svg: "/assets/logos/alpaca.svg",
          },
          {
            label: "AMD Live Price",
            value: "$168.40 (+2.85%)",
            platform_name: "Alpaca",
            logo_svg: "/assets/logos/alpaca.svg",
          },
          {
            label: "AI Sector News",
            value: "Very Bullish",
            platform_name: "IBKR",
            logo_svg: "/assets/logos/ibkr.svg",
          },
        ],
        slot_groups: [
          {
            slot_id: "ticker",
            label: "1. Select AI Chip Ticker",
            options: ["NVDA (Recommended)", "AMD", "SMH Semiconductor ETF"],
            selected_default: "NVDA (Recommended)",
          },
          {
            slot_id: "notional",
            label: "2. Order Size",
            options: ["$250.00", "$500.00 (Recommended)", "$1,000.00"],
            selected_default: "$500.00 (Recommended)",
          },
        ],
        proposals: [
          {
            option_id: "opt_ai_wf",
            outcome_to_build: "STRATEGY_WORKFLOW",
            badge_label: "Option 1 · Trading Workflow (Recommended)",
            title: "Buy NVDA When AI News is Bullish",
            description: "1. Signal: NVDA + AI News -> 2. Trigger: Bullish -> 3. Action: BUY $500 NVDA on Alpaca",
            follow_up_query: "Buy NVDA when AI news is bullish",
            platform: PLATFORM_REGISTRY.plat_alpaca,
            symbol: "NVDA",
            default_notional_usd: "500.00",
            recommended: true,
          },
          {
            option_id: "opt_ai_direct",
            outcome_to_build: "DIRECT_ACTION",
            badge_label: "Option 2 · Direct Trade Now",
            title: "Buy $1,000 of NVDA Right Now at Market",
            description: "Immediate market execution on Alpaca with 15-second locked quote preview",
            follow_up_query: "Buy $1,000 of NVDA right now at market",
            platform: PLATFORM_REGISTRY.plat_alpaca,
            symbol: "NVDA",
            default_notional_usd: "1000.00",
            recommended: false,
          },
          {
            option_id: "opt_ai_alert",
            outcome_to_build: "SMART_NOTICE",
            badge_label: "Option 3 · Smart Notification",
            title: "Alert Me on Semiconductor Export / AI News",
            description: "Instant Push + In-App alert whenever breaking news mentions NVDA or AMD",
            follow_up_query: "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
            platform: PLATFORM_REGISTRY.plat_alpaca,
            symbol: "NVDA",
            default_notional_usd: "0.00",
            recommended: false,
          },
        ],
      },
      "plat_alpaca",
    ];
  }

  if (q.includes("hedge") || q.includes("oil") || q.includes("middle east")) {
    return [
      {
        scenario_title: "Portfolio Hedge Selection (Geopolitical & Energy Shock)",
        why_confirmation_needed:
          "A geopolitical energy shock can be hedged via Safe-Haven Gold (GLD), Crude Oil ETFs (USO), or Event Contracts. Select which hedge instrument you want to deploy:",
        market_synthesis_summary:
          "During geopolitical supply disruptions, Gold (GLD) and Crude Oil (USO) show strong negative correlation to mega-cap growth equities, insulating portfolio drawdowns.",
        live_context: [
          {
            label: "GLD Gold Trust",
            value: "$254.60 (+1.55%)",
            platform_name: "Interactive Brokers",
            logo_svg: "/assets/logos/ibkr.svg",
          },
          {
            label: "USO Crude Oil ETF",
            value: "$78.45 (+2.40%)",
            platform_name: "Interactive Brokers",
            logo_svg: "/assets/logos/ibkr.svg",
          },
          {
            label: "Geopolitical Risk Odds",
            value: "38¢ (+6¢ Today)",
            platform_name: "Polymarket",
            logo_svg: "/assets/logos/polymarket.svg",
          },
        ],
        slot_groups: [],
        proposals: [
          {
            option_id: "opt_hedge_gld",
            outcome_to_build: "STRATEGY_WORKFLOW",
            badge_label: "Option 1 · Gold Safe-Haven Workflow (Recommended)",
            title: "Buy $500 GLD When Geopolitical Tension Rises",
            description: "Whenever Gold rises 1.5% on geopolitical tension news -> BUY $500 GLD on IBKR",
            follow_up_query: "Whenever Gold rises 1.5% on geopolitical tension news, buy $500 of GLD",
            platform: PLATFORM_REGISTRY.plat_ibkr,
            symbol: "GLD",
            default_notional_usd: "500.00",
            recommended: true,
          },
          {
            option_id: "opt_hedge_poly",
            outcome_to_build: "DIRECT_ACTION",
            badge_label: "Option 2 · Event Hedge Ticket",
            title: "Buy $250 Macro Hedge Shares Right Now",
            description: "Immediate execution on Polymarket CLOB to offset tail-risk volatility",
            follow_up_query: "Buy $250 of Fed 25bps Cut YES shares right now",
            platform: PLATFORM_REGISTRY.plat_polymarket,
            symbol: "FED-CUT-25BPS-YES",
            default_notional_usd: "250.00",
            recommended: false,
          },
          {
            option_id: "opt_hedge_alert",
            outcome_to_build: "SMART_NOTICE",
            badge_label: "Option 3 · Macro Regime Alert",
            title: "Alert Me on 10% Macro / Recession Odds Shift",
            description: "Notify me on Push + Email if Kalshi macro odds move by more than 10%",
            follow_up_query: "Let me know when Kalshi recession odds move by more than 10% in a single day",
            platform: PLATFORM_REGISTRY.plat_kalshi,
            symbol: "KXRECESSION-26",
            default_notional_usd: "0.00",
            recommended: false,
          },
        ],
      },
      "plat_ibkr",
    ];
  }

  if (q.includes("earnings")) {
    return [
      {
        scenario_title: "Earnings Event Strategy Comparison (NVDA Q4 Earnings)",
        why_confirmation_needed:
          "You asked for the best ways to trade the upcoming NVDA earnings call. Choose between an Automated Post-Earnings Momentum Workflow, a Pre-Earnings Direct Buy, or a Live Sentiment Alert:",
        market_synthesis_summary:
          "NVDA implied earnings move is ±6.8%. Waiting for guidance sentiment confirmation avoids initial whip-saw volatility while capturing multi-day post-earnings drift.",
        live_context: [
          {
            label: "NVDA Spot Price",
            value: "$211.11 (+4.16%)",
            platform_name: "Alpaca",
            logo_svg: "/assets/logos/alpaca.svg",
          },
          {
            label: "Earnings Guidance News",
            value: "Very Bullish",
            platform_name: "Robinhood",
            logo_svg: "/assets/logos/robinhood.svg",
          },
        ],
        slot_groups: [],
        proposals: [
          {
            option_id: "opt_earn_wf",
            outcome_to_build: "STRATEGY_WORKFLOW",
            badge_label: "Option 1 · Post-Earnings Workflow (Recommended)",
            title: "Buy NVDA Automatically When Earnings AI News is Bullish",
            description: "1. Signal: NVDA + Earnings News -> 2. Trigger: Bullish -> 3. Action: BUY $500 NVDA on Alpaca",
            follow_up_query: "Buy NVDA when AI news is bullish",
            platform: PLATFORM_REGISTRY.plat_alpaca,
            symbol: "NVDA",
            default_notional_usd: "500.00",
            recommended: true,
          },
          {
            option_id: "opt_earn_direct",
            outcome_to_build: "DIRECT_ACTION",
            badge_label: "Option 2 · Pre-Earnings Direct Buy",
            title: "Buy $1,000 of NVDA Right Now Ahead of Earnings",
            description: "Immediate market order on Alpaca with 15s locked price preview",
            follow_up_query: "Buy $1,000 of NVDA right now at market",
            platform: PLATFORM_REGISTRY.plat_alpaca,
            symbol: "NVDA",
            default_notional_usd: "1000.00",
            recommended: false,
          },
          {
            option_id: "opt_earn_alert",
            outcome_to_build: "SMART_NOTICE",
            badge_label: "Option 3 · Live Earnings News Alert",
            title: "Alert Me Instantly on NVDA / AMD Breaking Headlines",
            description: "Push + In-App notification as soon as earnings guidance crosses the wire",
            follow_up_query: "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
            platform: PLATFORM_REGISTRY.plat_alpaca,
            symbol: "NVDA",
            default_notional_usd: "0.00",
            recommended: false,
          },
        ],
      },
      "plat_alpaca",
    ];
  }

  return [
    {
      scenario_title: "Incomplete Crypto Dip-Buying Query — Select Asset & Dip Threshold",
      why_confirmation_needed:
        "You asked to 'put some money into crypto when the market dips', which needs a specific crypto asset (BTC, ETH, SOL) and dip percentage. Click a 1-click setup below:",
      market_synthesis_summary:
        "Bitcoin ($91,420) and Ethereum ($3,240) have strong institutional bid support on 4%–5% intraday pullbacks across Coinbase and Hyperliquid.",
      live_context: [
        {
          label: "BTC-USD Spot",
          value: "$91,420 (+3.84%)",
          platform_name: "Coinbase",
          logo_svg: "/assets/logos/coinbase.svg",
        },
        {
          label: "ETH-PERP Price",
          value: "$3,242.50 (+2.71%)",
          platform_name: "Hyperliquid",
          logo_svg: "/assets/logos/hyperliquid.svg",
        },
      ],
      slot_groups: [
        {
          slot_id: "crypto_asset",
          label: "1. Select Crypto Asset",
          options: ["ETH-PERP on Hyperliquid (Recommended)", "BTC-USD on Coinbase", "SOL-PERP on Hyperliquid"],
          selected_default: "ETH-PERP on Hyperliquid (Recommended)",
        },
        {
          slot_id: "dip_threshold",
          label: "2. Dip Trigger Threshold",
          options: ["-3.0% in 1h", "-5.0% in 1h + Rebound (Recommended)", "-8.0% in 24h"],
          selected_default: "-5.0% in 1h + Rebound (Recommended)",
        },
        {
          slot_id: "dip_size",
          label: "3. Allocation Size",
          options: ["$500.00", "$1,000.00", "$2,000.00 (Recommended)"],
          selected_default: "$2,000.00 (Recommended)",
        },
      ],
      proposals: [
        {
          option_id: "opt_dip_eth",
          outcome_to_build: "STRATEGY_WORKFLOW",
          badge_label: "Option 1 · ETH Dip-Rebound Workflow (Recommended)",
          title: "Long $2,000 ETH When ETH Drops 5% in 1h & Rebounds",
          description: "Auto-executes on Hyperliquid L1 when a 5% 1-hour dip prints a 5m green rebound bar",
          follow_up_query: "Long $2,000 ETH at 3x leverage whenever ETH drops 5% in 1 hour and rebounds",
          platform: PLATFORM_REGISTRY.plat_hyperliquid,
          symbol: "ETH-PERP",
          default_notional_usd: "2000.00",
          recommended: true,
        },
        {
          option_id: "opt_dip_btc",
          outcome_to_build: "STRATEGY_WORKFLOW",
          badge_label: "Option 2 · BTC Momentum & ETF Workflow",
          title: "Buy $1,000 BTC on Coinbase on Positive ETF Inflow Catalyst",
          description: "Auto-executes spot BTC-USD order on Coinbase with TP +12% / SL -4%",
          follow_up_query: "If Bitcoin breaks above $95,000 on positive ETF inflow news, buy $1,000 BTC",
          platform: PLATFORM_REGISTRY.plat_coinbase,
          symbol: "BTC-USD",
          default_notional_usd: "1000.00",
          recommended: false,
        },
        {
          option_id: "opt_dip_notice",
          outcome_to_build: "SMART_NOTICE",
          badge_label: "Option 3 · Volatility Alert Only",
          title: "Notify Me When BTC Moves 4% in 1 Hour",
          description: "Sends Push + Email alert without placing an automated order",
          follow_up_query: "Notify me when BTC moves 4% in 1 hour or breaking Bitcoin ETF news drops",
          platform: PLATFORM_REGISTRY.plat_binance,
          symbol: "BTC-USD",
          default_notional_usd: "0.00",
          recommended: false,
        },
      ],
    },
    "plat_hyperliquid",
  ];
}

export function compileNaturalLanguageQuery(
  query: string,
  environment: "PAPER" | "LIVE" = "PAPER",
  overridePlatformId?: string,
  overrideNotionalUsd?: string
): CompileQueryResponse {
  const cleanQuery = query.trim() || "Buy NVDA when AI news is bullish";
  const qLower = cleanQuery.toLowerCase();

  // Outcome 4: Vague / Exploratory Query -> Ask User Confirmation
  if (isVagueOrExploratoryQuery(cleanQuery)) {
    const [confPayload, primaryPid] = buildVagueConfirmationPayload(cleanQuery);
    const primaryPlat = PLATFORM_REGISTRY[primaryPid] ?? PLATFORM_REGISTRY.plat_alpaca;
    const thinkingSteps: ThinkingStep[] = [
      {
        step_number: 1,
        title: "Step 1 · Understanding Intent",
        detail: "Detected open-ended / exploratory prompt -> Routing to Grounded Synthesis & 1-Click Confirmation",
        status: "completed",
        duration_ms: 190,
      },
      {
        step_number: 2,
        title: "Step 2 · AI Auto-Platform Matching",
        detail: `Pre-matched connected venues (${primaryPlat.short_name}, Alpaca, Coinbase, Kalshi) with brand logos`,
        status: "completed",
        duration_ms: 210,
      },
      {
        step_number: 3,
        title: "Step 3 · Live Market Price & News Sentiment Check",
        detail: "Synthesized live prices, implied event odds, and real-time news sentiment",
        status: "completed",
        duration_ms: 240,
      },
      {
        step_number: 4,
        title: "Step 4 · Preparing 1-Click Confirmation Options",
        detail: `Prepared ${confPayload.proposals.length} actionable diagram options for user confirmation`,
        status: "completed",
        duration_ms: 180,
      },
    ];
    return {
      query: cleanQuery,
      outcome_mode: "ASK_USER_CONFIRMATION",
      thinking_steps: thinkingSteps,
      total_thinking_ms: 820,
      auto_selected_platform: primaryPlat,
      confirmation_prompt: confPayload,
    };
  }

  const [symbol, assetName, assetClass] = detectAssetAndClass(cleanQuery);
  const platform =
    overridePlatformId && PLATFORM_REGISTRY[overridePlatformId]
      ? PLATFORM_REGISTRY[overridePlatformId]
      : autoSelectPlatform(symbol, assetClass, cleanQuery);
  const quote = MARKET_QUOTES[symbol] ?? {
    name: assetName,
    asset_class: assetClass,
    price: "125.00",
    change_pct: "+1.50%",
  };

  // Outcome 2: Smart Notification Diagram
  if (isNotificationQuery(cleanQuery)) {
    const noticeRoutes = buildAllPlatformExecutionRoutes(
      cleanQuery,
      symbol,
      assetName,
      assetClass,
      "BUY",
      "500.00",
      platform.platform_id
    );
    let topic = "Bitcoin & Crypto ETF Flows";
    let headlineCond = "1h Price Move >= +4.0% OR Breaking ETF News = High Impact";
    let clauses = ["BTC 1-Hour Price Move >= ±4.0%", "OR Breaking Bitcoin ETF News = High Impact"];
    let channels: NoticeChannel[] = ["Push", "Email", "In-App"];
    let cooldown = "15m";

    if (qLower.includes("funding")) {
      topic = "Perpetual Funding Rate Telemetry";
      headlineCond = "Annualized ETH-PERP Funding Rate > 35.0%";
      clauses = ["Annualized Funding Rate > 35.0%", "Sustained for >= 5 minutes"];
      channels = ["Push", "Webhook", "In-App"];
      cooldown = "1h";
    } else if (qLower.includes("20-day") || qLower.includes("moving average")) {
      topic = "Technical Price & Volume Breakdown";
      headlineCond = "AAPL Close < 20-Day SMA AND Volume > 1.5x Avg";
      clauses = ["Daily Close crosses below SMA(20)", "Session Volume >= 1.5x 20d Average"];
      channels = ["Email", "In-App"];
      cooldown = "Once per session";
    } else if (qLower.includes("75%") || qLower.includes("probability")) {
      topic = "Prediction Market Implied Odds";
      headlineCond = "Fed December Rate Cut Odds Cross Above 75%";
      clauses = ["Contract Implied Probability crosses above 75.0%", "Hysteresis buffer: 1.0%"];
      channels = ["Push", "Webhook", "In-App"];
      cooldown = "30m";
    } else if (qLower.includes("10%") || qLower.includes("recession")) {
      topic = "Macro Event Volatility";
      headlineCond = "Kalshi Recession Odds 24h Move >= ±10.0%";
      clauses = ["Absolute 24h Probability Change >= 10.0%"];
      channels = ["Push", "Email", "In-App"];
      cooldown = "1h";
    } else if (qLower.includes("export") || qLower.includes("mentions")) {
      topic = "Semiconductors & Export Policy News";
      headlineCond = "Breaking News Mentions NVDA or AMD (High Impact)";
      clauses = ["Entity in {NVDA, AMD}", "News Sentiment = High-Impact Catalyst"];
      channels = ["Push", "In-App"];
      cooldown = "5m";
    }

    const thinkingSteps: ThinkingStep[] = [
      {
        step_number: 1,
        title: "Step 1 · Understanding Intent",
        detail: "Classified as Smart Notification Diagram (1. Signal -> 2. Trigger -> 3. Notice Action)",
        status: "completed",
        duration_ms: 160,
      },
      {
        step_number: 2,
        title: "Step 2 · Multi-Platform & Feed Binding",
        detail: `Generated all ${noticeRoutes.length} connected platforms for ${symbol} (${assetName})`,
        status: "completed",
        duration_ms: 180,
      },
      {
        step_number: 3,
        title: "Step 3 · Live Market Price & News Sentiment Check",
        detail: `Verified live ${symbol} price ($${quote.price}) and ${topic} stream`,
        status: "completed",
        duration_ms: 210,
      },
      {
        step_number: 4,
        title: "Step 4 · Building 3-Part Smart Notification Diagram",
        detail: `Compiled state-crossing trigger with 0.25% hysteresis and ${cooldown} cooldown`,
        status: "completed",
        duration_ms: 170,
      },
    ];

    const noticeDiagram: SmartNoticeDiagramSpec = {
      alert_id: `alt_${shortHash(cleanQuery).slice(0, 8)}`,
      title: `${symbol} Smart Market & News Notification`,
      summary: cleanQuery,
      environment,
      signal: {
        node_id: "sig_01",
        price_source_label: "Live Market Price",
        symbol,
        asset_name: assetName,
        asset_class: assetClass,
        spot_price: quote.price,
        change_24h_pct: quote.change_pct,
        news_feed_label: "Market News Sentiment",
        news_topic: topic,
        sentiment_state: "High-Impact Catalyst",
        schedule_cadence: "Real-Time Streaming (<= 15s Freshness)",
      },
      trigger: {
        node_id: "trig_01",
        headline_condition: headlineCond,
        operator_label: headlineCond.includes(" OR ") ? "ANY_OF (OR)" : "ALL_OF (AND)",
        clauses,
        evaluation_mode: "State Crossing",
        hysteresis_buffer: "0.25%",
        cooldown_window: cooldown,
        missing_data_policy: "Emit Unknown (Never Trigger on Stale Data)",
      },
      action: {
        node_id: "act_notice_01",
        action_type: "SMART_NOTICE",
        platform,
        execution_routes: noticeRoutes,
        symbol,
        asset_name: assetName,
        notice_title: `Alert: ${headlineCond}`,
        channels,
        hysteresis: "0.25%",
        cooldown,
        deduplication_key: `dedup_${symbol.toLowerCase()}_${shortHash(cleanQuery).slice(0, 6)}`,
        quick_trade_shortcut_symbol: symbol,
      },
    };

    return {
      query: cleanQuery,
      outcome_mode: "SMART_NOTICE",
      thinking_steps: thinkingSteps,
      total_thinking_ms: 720,
      auto_selected_platform: platform,
      notice_diagram: noticeDiagram,
    };
  }

  // Outcome 3: Direct Trade Ticket
  if (isDirectTradeQuery(cleanQuery)) {
    let [notionalUsd] = extractDollarAmount(cleanQuery, "500.00");
    if (overrideNotionalUsd) {
      notionalUsd = overrideNotionalUsd;
    } else if (qLower.includes("0.5 eth")) {
      notionalUsd = "1620.00";
    } else if (qLower.includes("10 shares of tsla")) {
      notionalUsd = "2550.00";
    }

    let side: TradeSide = "BUY";
    let orderType = "Market Order (Price Collar <= 30 bps)";
    if (qLower.includes("swap")) {
      side = "SWAP";
      orderType = "Onchain AMM Swap (Max Slippage <= 0.50%)";
    } else if (qLower.includes("2x long") || qLower.includes("long")) {
      side = "LONG 2x";
      orderType = "Isolated Perpetual Market (Collar <= 25 bps)";
    } else if (qLower.includes("sell")) {
      side = "SELL";
      orderType = qLower.includes("255") ? "Day Limit Order ($255.00 Limit)" : "Market Order";
    } else if (assetClass === "PREDICTION") {
      side = "BUY YES";
      orderType = "CLOB Limit Collar (<= 68¢)";
    }

    const directRoutes = buildAllPlatformExecutionRoutes(
      cleanQuery,
      symbol,
      assetName,
      assetClass,
      side,
      notionalUsd,
      platform.platform_id
    );
    const allCompatible = directRoutes.map((r) => r.platform);
    const estUnits = formatEstimatedUnits(notionalUsd, quote.price, symbol);
    const thinkingSteps: ThinkingStep[] = [
      {
        step_number: 1,
        title: "Step 1 · Understanding Intent",
        detail: "Classified as Direct Trade Execution (Immediate Order with 0 Waiting Conditions)",
        status: "completed",
        duration_ms: 150,
      },
      {
        step_number: 2,
        title: "Step 2 · Multi-Platform Route Generation",
        detail: `Generated all ${directRoutes.length} connected platform routes (primary: ${platform.name})`,
        status: "completed",
        duration_ms: 170,
      },
      {
        step_number: 3,
        title: "Step 3 · Live Market Price & Buying Power Check",
        detail: `Locked 15s quote ($${quote.price}) and verified $${platform.available_balance_usd} available balance`,
        status: "completed",
        duration_ms: 190,
      },
      {
        step_number: 4,
        title: "Step 4 · Building Direct Trade Ticket",
        detail: "Passed all 13 pre-trade risk gates and generated Direct Trade Ticket",
        status: "completed",
        duration_ms: 160,
      },
    ];

    const ticket: DirectTradeTicketSpec = {
      ticket_id: `tkt_${shortHash(cleanQuery).slice(0, 8)}`,
      title: `Direct Trade: ${side} ${symbol} on ${platform.short_name}`,
      environment,
      platform,
      compatible_platforms: allCompatible,
      execution_routes: directRoutes,
      side,
      symbol,
      asset_name: assetName,
      asset_class: assetClass,
      order_type: orderType,
      notional_usd: notionalUsd,
      estimated_units: estUnits,
      live_price: quote.price,
      change_24h_pct: quote.change_pct,
      quote_id: `qt_${shortHash(cleanQuery + quote.price).slice(0, 10)}`,
      quote_expires_in_sec: 15,
      available_buying_power_usd: platform.available_balance_usd,
      estimated_fee_usd: ["plat_alpaca", "plat_robinhood", "plat_schwab"].includes(platform.platform_id)
        ? "0.00"
        : "0.85",
      take_profit_pct: "+15.0%",
      stop_loss_pct: "-5.0%",
      pretrade_risk_checks_passed: 13,
    };

    return {
      query: cleanQuery,
      outcome_mode: "DIRECT_ACTION",
      thinking_steps: thinkingSteps,
      total_thinking_ms: 670,
      auto_selected_platform: platform,
      direct_trade_ticket: ticket,
    };
  }

  // Outcome 1: Trading Workflow Diagram (Immediate 3-Part DAG with Smart Defaults)
  let [notionalUsd, smartDefaultUsed] = extractDollarAmount(cleanQuery, "500.00");
  if (overrideNotionalUsd) {
    notionalUsd = overrideNotionalUsd;
    smartDefaultUsed = false;
  }

  let wfSide: TradeSide = "BUY";
  let tpPct = "+15.0%";
  let slPct = "-5.0%";
  if (qLower.includes("sell")) {
    wfSide = "SELL";
    tpPct = "N/A (Position Reduce)";
    slPct = "-4.0% Trailing";
  } else if (qLower.includes("3x") || (qLower.includes("long") && assetClass === "PERP")) {
    wfSide = "LONG 3x";
    tpPct = "+18.0%";
    slPct = "-6.0%";
  } else if (assetClass === "PREDICTION") {
    wfSide = "BUY YES";
    tpPct = "92¢ Target (+35%)";
    slPct = "52¢ Stop (-23%)";
  } else if (symbol === "GLD") {
    wfSide = "BUY";
    tpPct = "+8.0%";
    slPct = "-3.0%";
  } else if (symbol === "BTC-USD") {
    wfSide = "BUY";
    tpPct = "+12.0%";
    slPct = "-4.0%";
  }

  const executionRoutes = buildAllPlatformExecutionRoutes(
    cleanQuery,
    symbol,
    assetName,
    assetClass,
    wfSide,
    notionalUsd,
    platform.platform_id
  );
  const allCompatible = executionRoutes.map((r) => r.platform);

  let newsFeedLabel = "Market News Sentiment";
  let newsTopic =
    symbol === "NVDA" || symbol === "AMD" || symbol === "SMH"
      ? "AI & Semiconductors"
      : `${assetName} (${symbol}) News & Catalysts`;
  let sentimentState: SentimentLabel = "Bullish";
  let headlineCond =
    symbol === "NVDA"
      ? "AI News Sentiment = Bullish"
      : `${symbol} News & Catalyst Sentiment = Bullish`;
  let clauses = [
    `Market News Sentiment (${newsTopic}) = Bullish`,
    `Live ${symbol} Market Feed Freshness <= 15s`,
  ];

  const hasSocialX = [
    "twitter",
    "tweet",
    "twitt",
    "x.com",
    " on x",
    "truth social",
    "elon",
    "trump",
  ].some((w) => qLower.includes(w));
  const isOilWar = [
    "oil",
    "war",
    "starting star",
    "starting war",
    "crude",
    "middle east",
  ].some((w) => qLower.includes(w));

  if (isOilWar && hasSocialX) {
    newsFeedLabel = "X (Twitter) & Social Stream";
    newsTopic = "Donald Trump (@realDonaldTrump) War & Oil Escalation Mentions";
    sentimentState = "High-Impact Catalyst";
    headlineCond = "Donald Trump Mentions Starting a War or Military Escalation on X / Social Media";
    clauses = [
      "X (Twitter) & Social Stream: @realDonaldTrump post mentions war, military strike, or oil supply shock",
      "Multi-Venue Execution: Route simultaneously across Oil Stocks (XOM, USO, CVX, OXY) & Tokens/Perps (PAXG, POWR, OIL-PERP)",
    ];
  } else if (hasSocialX) {
    newsFeedLabel = "X (Twitter) & Social Stream";
    const actor = qLower.includes("trump")
      ? "Donald Trump (@realDonaldTrump)"
      : qLower.includes("elon")
      ? "Elon Musk (@elonmusk)"
      : "Verified X (Twitter) Account";
    newsTopic = `${actor} X (Twitter) Mentions of ${symbol}`;
    sentimentState = "High-Impact Catalyst";
    headlineCond = `${actor} Posts About ${assetName} (${symbol}) on X (Twitter)`;
    clauses = [
      `X (Twitter) Real-Time Stream: ${actor} post mentions '${symbol}' or '${assetName.split(" ")[0]}'`,
      `Live ${symbol} Market Feed Freshness <= 15s`,
    ];
  } else if (qLower.includes("95,000") || qLower.includes("bitcoin")) {
    newsTopic = "Bitcoin ETF Inflows & Institutional Demand";
    sentimentState = "Bullish";
    headlineCond = "BTC Live Price > $95,000 AND ETF News Sentiment = Bullish";
    clauses = ["Live Market Price > $95,000.00", "Market News Sentiment (Bitcoin ETF) = Bullish"];
  } else if (qLower.includes("drops 5%") || qLower.includes("rebounds")) {
    newsTopic = "Intraday Dip & Mean-Reversion Signal";
    sentimentState = "Bullish";
    headlineCond = "ETH 1h Move <= -5.0% AND 5m Rebound Candle = Green";
    clauses = ["1-Hour Price Change <= -5.0%", "Finalized 5m Bar Close > Open (Rebound Confirmed)"];
  } else if (qLower.includes("cpi") || qLower.includes("2.5%")) {
    newsTopic = "US CPI Inflation & Fed Rate Policy";
    sentimentState = "Bullish";
    headlineCond = "US CPI YoY < 2.5% AND Macro News = Dovish";
    clauses = ["Reported US CPI Inflation YoY < 2.5%", "Contract Price <= 72¢ Collar"];
  } else if (qLower.includes("bearish") || qLower.includes("falls 4%")) {
    newsTopic = "EV Deliveries & Automotive Margins";
    sentimentState = "Bearish";
    headlineCond = "EV News Sentiment = Bearish OR TSLA Session Move <= -4.0%";
    clauses = ["Market News Sentiment (EV Deliveries) = Bearish", "OR Intraday Price Move <= -4.0%"];
  } else if (qLower.includes("gold") || qLower.includes("gld")) {
    newsTopic = "Geopolitical Risk & Safe-Haven Flows";
    sentimentState = "High-Impact Catalyst";
    headlineCond = "GLD Session Move >= +1.5% AND Geopolitical News = High Impact";
    clauses = ["Live Price Move >= +1.50%", "Market News Sentiment (Geopolitics) = High Impact"];
  } else if (
    !qLower.includes("news") &&
    [
      "moving average",
      "sma",
      "ema",
      "rsi",
      "macd",
      "bollinger",
      "vwap",
      "200 day",
      "200-day",
      "50 day",
      "50-day",
      "20-day",
      "20 day",
      "above",
      "below",
      "crosses",
      "breaks",
    ].some((k) => qLower.includes(k))
  ) {
    newsFeedLabel =
      assetClass === "CRYPTO_SPOT" || assetClass === "PERP"
        ? "Crypto Price & Technicals"
        : "Stock Price & Technicals";
    const maMatch = qLower.match(/(\d+)[\s-]*day\s+moving\s+average/);
    if (maMatch?.[1]) {
      const days = maMatch[1];
      const isBelow =
        qLower.includes("below") || qLower.includes("under") || qLower.includes("drops");
      const compOp = isBelow ? "<" : ">";
      newsTopic = `${symbol} Price & ${days}-Day Moving Average (SMA ${days})`;
      headlineCond = `${symbol} Spot Price ${compOp} ${days}-Day Moving Average (SMA ${days})`;
      clauses = [
        `${symbol} Live Price ($${quote.price}) ${compOp} ${days}-Day SMA`,
        `Confirmed on bar close · Execute ${wfSide} ${symbol}`,
      ];
    } else {
      newsTopic = `${symbol} Live Price & Technical Indicator Stream`;
      headlineCond = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1);
      clauses = [
        `Live ${symbol} Price ($${quote.price}) satisfies technical condition`,
        `Execute ${wfSide} ${symbol} when condition evaluates True`,
      ];
    }
    sentimentState =
      qLower.includes("sell") || qLower.includes("short") || qLower.includes("below")
        ? "Bearish"
        : "Bullish";
  }

  const estUnits = formatEstimatedUnits(notionalUsd, quote.price, symbol);
  const primarySignal: SignalNodeSpec = {
    node_id: "sig_01",
    price_source_label: "Live Market Price",
    symbol,
    asset_name: assetName,
    asset_class: assetClass,
    spot_price: quote.price,
    change_24h_pct: quote.change_pct,
    news_feed_label: newsFeedLabel,
    news_topic: newsTopic,
    sentiment_state: sentimentState,
    schedule_cadence: "Real-Time Streaming (<= 15s Freshness)",
  };
  const primaryTrigger: TriggerNodeSpec = {
    node_id: "trig_01",
    headline_condition: headlineCond,
    operator_label: headlineCond.includes(" OR ") ? "ANY_OF (OR)" : "ALL_OF (AND)",
    clauses,
    evaluation_mode: "State Crossing",
    hysteresis_buffer: "0.25%",
    cooldown_window: "15m",
    missing_data_policy: "Emit Unknown (Never Trigger on Stale Data)",
  };
  const primaryAction: TradeActionNodeSpec = {
    node_id: "act_trade_01",
    action_type: "TRADE_ORDER",
    platform,
    compatible_platforms: allCompatible,
    execution_routes: executionRoutes,
    side: wfSide,
    symbol,
    asset_name: assetName,
    order_type: "Market (Collar <= 35 bps)",
    notional_usd: notionalUsd,
    estimated_units: estUnits,
    smart_default_applied: smartDefaultUsed,
    take_profit_pct: tpPct,
    stop_loss_pct: slPct,
    position_policy: "Enter Only If Flat (Max 1 Open Leg)",
  };

  const [dagSignals, dagPaths] = buildMultiInputSignalsAndPaths(
    cleanQuery,
    primarySignal,
    primaryTrigger,
    primaryAction,
    notionalUsd,
    smartDefaultUsed,
    overridePlatformId
  );

  const semHash = shortHash(
    `${symbol}:${platform.platform_id}:${wfSide}:${notionalUsd}:${headlineCond}:paths=${dagPaths.length}`
  );
  const isMultiPath = dagPaths.length > 1;

  const thinkingSteps: ThinkingStep[] = [
    {
      step_number: 1,
      title: "Step 1 · Understanding Intent (OpenAI GPT-5.5)",
      detail: isMultiPath
        ? `Bound 1 Signal Block (${newsFeedLabel}) with 2 outputs: Positive (+) -> Buy Oil Stocks & Tokens, Negative (−) -> Short Oil`
        : `Parsed ${newsFeedLabel} intent for ${symbol} (${assetName}) -> Signal: ${newsTopic} | Trigger: ${headlineCond}`,
      status: "completed",
      duration_ms: 170,
    },
    {
      step_number: 2,
      title: "Step 2 · Multi-Platform Asset Routing (16 Venues per Path)",
      detail: `Generated execution legs across all ${executionRoutes.length} platforms for each of the ${dagPaths.length} conditional path(s)`,
      status: "completed",
      duration_ms: 190,
    },
    {
      step_number: 3,
      title: isMultiPath
        ? "Step 3 · Signal Block Dual-Output Polarity Check"
        : "Step 3 · Live Signal & Condition Verification",
      detail: isMultiPath
        ? `Configured Signal Block (${dagSignals[0].symbol}) with Output + (Escalation) & Output − (Iran De-Escalation)`
        : `Bound live signal stream (${dagSignals[0].symbol}) · ${newsFeedLabel}: ${newsTopic}`,
      status: "completed",
      duration_ms: 220,
    },
    {
      step_number: 4,
      title: isMultiPath
        ? "Step 4 · Building 1-Signal, 2-Output Branching DAG"
        : "Step 4 · Compiling Signal → Trigger → Action DAG",
      detail: isMultiPath
        ? `Compiled 1 Signal Block -> 2 Outputs (+ / −) -> ${dagPaths.length} Execution Paths with $${notionalUsd} per-path allocation`
        : smartDefaultUsed
        ? `Compiled multi-platform DAG with $${notionalUsd} smart-default size and ${tpPct} / ${slPct} guardrails`
        : `Compiled multi-platform DAG with $${notionalUsd} allocation and ${tpPct} / ${slPct} guardrails`,
      status: "completed",
      duration_ms: 180,
    },
  ];

  const workflow: WorkflowDiagramSpec = {
    strategy_id: `strat_${semHash.slice(0, 8)}`,
    title: isMultiPath
      ? `1 Signal Block (2 Outputs: + / −) → ${dagPaths.length} Paths · ${newsTopic}`
      : `${headlineCond} → ${wfSide} ${symbol}`,
    thesis_summary: cleanQuery,
    version: 1,
    environment,
    semantic_hash: semHash,
    authorization_epoch: platform.authorization_epoch,
    signal: primarySignal,
    trigger: primaryTrigger,
    action: primaryAction,
    signals: dagSignals,
    paths: dagPaths,
  };

  return {
    query: cleanQuery,
    outcome_mode: "STRATEGY_WORKFLOW",
    thinking_steps: thinkingSteps,
    total_thinking_ms: 760,
    auto_selected_platform: platform,
    workflow_diagram: workflow,
  };
}

/**
 * Curated Multi-Category Market News Feed (Clean user-facing labels, zero provider jargon).
 */
export function getCuratedMarketNews(
  category: NewsCategory = "global",
  ticker?: string | null
): MarketNewsArticle[] {
  const articles: MarketNewsArticle[] = [
    {
      article_id: "news_gl_01",
      category: "global",
      publisher_name: "South China Morning Post",
      publisher_monogram: "SC",
      publisher_bg_hex: "#1E293B",
      publisher_fg_hex: "#FACC15",
      published_label: "Oct 7",
      published_utc: "2026-10-24T14:20:00Z",
      title: "Trump urged Xi to talk to Takaichi and lift export curbs on Japan, sources say",
      summary:
        "Cross-border trade and semiconductor supply chain diplomacy shows signs of easing export bottlenecks across Asia-Pacific technology hubs.",
      primary_ticker: "NVDA",
      asset_class: "EQUITY",
      sentiment_label: "Bullish",
      source_url: "https://www.scmp.com",
      auto_platform: PLATFORM_REGISTRY.plat_alpaca,
      workflow_prompt: "Buy NVDA when AI news is bullish",
      alert_prompt: "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
    },
    {
      article_id: "news_gl_02",
      category: "global",
      publisher_name: "Economic Times",
      publisher_monogram: "ET",
      publisher_bg_hex: "#DC2626",
      publisher_fg_hex: "#FFFFFF",
      published_label: "Oct 7",
      published_utc: "2026-10-24T13:55:00Z",
      title: "Putin backs mediation efforts on Middle East war, tells Iran Moscow ready to help de-escalate",
      summary:
        "Energy markets and safe-haven commodities react as diplomatic channels open around crude oil shipping lanes.",
      primary_ticker: "XOM",
      asset_class: "EQUITY",
      sentiment_label: "High-Impact Catalyst",
      source_url: "https://economictimes.indiatimes.com",
      auto_platform: PLATFORM_REGISTRY.plat_alpaca,
      workflow_prompt: "If trump mentioned about starting a war, you should buy oil related stock and tokens, if trump mentioned about stoping a war in Iran , you should shorting oil",
      alert_prompt: "Let me know when Kalshi recession odds move by more than 10% in a single day",
    },
    {
      article_id: "news_gl_03",
      category: "global",
      publisher_name: "Polymarket Live Odds",
      publisher_monogram: "PM",
      publisher_bg_hex: "#1652F0",
      publisher_fg_hex: "#FFFFFF",
      published_label: "Live",
      published_utc: "2026-10-24T15:10:00Z",
      title: "Polymarket: Fed December 25bps Rate Cut YES contract surges to 68¢ (+6.2% 24h) on $42M volume",
      summary:
        "Rate-cut probability contracts on prediction venues climb to 68¢ following dovish commentary from regional Fed governors.",
      primary_ticker: "FED-CUT-25BPS-YES",
      asset_class: "PREDICTION",
      sentiment_label: "Bullish",
      source_url: "https://polymarket.com",
      auto_platform: PLATFORM_REGISTRY.plat_polymarket,
      workflow_prompt: "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
      alert_prompt: "Ping me if the Fed December rate cut probability crosses above 75%",
    },
    {
      article_id: "news_gl_04",
      category: "global",
      publisher_name: "Kalshi Prediction Market",
      publisher_monogram: "KL",
      publisher_bg_hex: "#00C896",
      publisher_fg_hex: "#111827",
      published_label: "4m ago",
      published_utc: "2026-10-24T15:08:00Z",
      title: "Kalshi WTI Crude Oil > $90 contract spikes +7.9% as Middle East energy traders hedge supply risk",
      summary:
        "CFTC-regulated event contracts on Kalshi and oil perpetuals on Hyperliquid see elevated hedging activity.",
      primary_ticker: "USO",
      asset_class: "ETF",
      sentiment_label: "High-Impact Catalyst",
      source_url: "https://kalshi.com",
      auto_platform: PLATFORM_REGISTRY.plat_kalshi,
      workflow_prompt: "If trump mentioned about starting a war, you should buy oil related stock and tokens, if trump mentioned about stoping a war in Iran , you should shorting oil",
      alert_prompt: "Let me know when Kalshi recession odds move by more than 10% in a single day",
    },
    {
      article_id: "news_gl_05",
      category: "global",
      publisher_name: "Polygon.io Market Wire",
      publisher_monogram: "PG",
      publisher_bg_hex: "#5849BE",
      publisher_fg_hex: "#FFFFFF",
      published_label: "8m ago",
      published_utc: "2026-10-24T15:06:00Z",
      title: "Dell Technologies (DELL) climbs to $456.44 on enterprise AI server backlog & social media momentum",
      summary:
        "Institutional block flow and X social stream mentions drive elevated volume across DELL and semiconductor peers.",
      primary_ticker: "DELL",
      asset_class: "EQUITY",
      sentiment_label: "Bullish",
      source_url: "https://polygon.io",
      auto_platform: PLATFORM_REGISTRY.plat_alpaca,
      workflow_prompt: "Could you monitor if Trump twitts about a Dell again, Buy Dell",
      alert_prompt: "Alert me whenever breaking news mentions DELL",
    },
    {
      article_id: "news_tc_01",
      category: "tech",
      publisher_name: "Benzinga",
      publisher_monogram: "BZ",
      publisher_bg_hex: "#1D4ED8",
      publisher_fg_hex: "#FFFFFF",
      published_label: "12m ago",
      published_utc: "2026-10-24T15:05:00Z",
      title: "NVIDIA Blackwell Ultra rack shipments exceed hyperscaler Q4 guidance by 18%",
      summary:
        "Cloud AI capex commitments from major US hyperscalers accelerate server rack deployments through Q1.",
      primary_ticker: "NVDA",
      asset_class: "EQUITY",
      sentiment_label: "Very Bullish",
      source_url: "https://www.benzinga.com",
      auto_platform: PLATFORM_REGISTRY.plat_alpaca,
      workflow_prompt: "Buy NVDA when AI news is bullish",
      alert_prompt: "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
    },
    {
      article_id: "news_tc_02",
      category: "tech",
      publisher_name: "MarketWatch",
      publisher_monogram: "MW",
      publisher_bg_hex: "#15803D",
      publisher_fg_hex: "#FFFFFF",
      published_label: "34m ago",
      published_utc: "2026-10-24T14:40:00Z",
      title: "AMD unveils next-gen Instinct MI350 cluster wins across enterprise AI inference workloads",
      summary:
        "Semiconductor ETF SMH climbs +3.1% as data-center GPU demand expands across enterprise cloud providers.",
      primary_ticker: "AMD",
      asset_class: "EQUITY",
      sentiment_label: "Bullish",
      source_url: "https://www.marketwatch.com",
      auto_platform: PLATFORM_REGISTRY.plat_alpaca,
      workflow_prompt: "Buy NVDA when AI news is bullish",
      alert_prompt: "Alert me whenever breaking semiconductor export news mentions NVDA or AMD",
    },
    {
      article_id: "news_bt_01",
      category: "bitcoin",
      publisher_name: "Bloomberg",
      publisher_monogram: "BB",
      publisher_bg_hex: "#111827",
      publisher_fg_hex: "#FFFFFF",
      published_label: "18m ago",
      published_utc: "2026-10-24T14:58:00Z",
      title: "Spot Bitcoin ETFs record $890M single-day net inflow as institutional treasury allocations rise",
      summary:
        "BTC spot orderbooks on Coinbase and Binance tighten above $91,400 amid sustained institutional demand.",
      primary_ticker: "BTC-USD",
      asset_class: "CRYPTO_SPOT",
      sentiment_label: "Very Bullish",
      source_url: "https://www.bloomberg.com",
      auto_platform: PLATFORM_REGISTRY.plat_coinbase,
      workflow_prompt: "If Bitcoin breaks above $95,000 on positive ETF inflow news, buy $1,000 BTC",
      alert_prompt: "Notify me when BTC moves 4% in 1 hour or breaking Bitcoin ETF news drops",
    },
    {
      article_id: "news_bt_02",
      category: "bitcoin",
      publisher_name: "Reuters",
      publisher_monogram: "RT",
      publisher_bg_hex: "#EA580C",
      publisher_fg_hex: "#FFFFFF",
      published_label: "49m ago",
      published_utc: "2026-10-24T14:25:00Z",
      title: "Ethereum L2 rollup throughput hits all-time high while perpetual funding rates stay balanced",
      summary:
        "Onchain perpetual open interest on Hyperliquid and dYdX expands 14% week-over-week.",
      primary_ticker: "ETH-PERP",
      asset_class: "PERP",
      sentiment_label: "Bullish",
      source_url: "https://www.reuters.com",
      auto_platform: PLATFORM_REGISTRY.plat_hyperliquid,
      workflow_prompt: "Long $2,000 ETH at 3x leverage whenever ETH drops 5% in 1 hour and rebounds",
      alert_prompt: "Watch ETH perpetual funding rates and alert me if annualized funding exceeds 35%",
    },
    {
      article_id: "news_sp_01",
      category: "sports",
      publisher_name: "Benzinga",
      publisher_monogram: "BZ",
      publisher_bg_hex: "#1D4ED8",
      publisher_fg_hex: "#FFFFFF",
      published_label: "1h ago",
      published_utc: "2026-10-24T14:00:00Z",
      title: "Live sports streaming rights & interactive event volumes surge 29% in Q4",
      summary:
        "Major league broadcast partnerships drive record concurrent engagement across digital platforms.",
      primary_ticker: "SPY",
      asset_class: "ETF",
      sentiment_label: "Bullish",
      source_url: "https://www.benzinga.com",
      auto_platform: PLATFORM_REGISTRY.plat_alpaca,
      workflow_prompt: "Buy $1,000 of NVDA right now at market",
      alert_prompt: "Send me an email if AAPL drops below its 20-day moving average on high volume",
    },
    {
      article_id: "news_pc_01",
      category: "pop_culture",
      publisher_name: "The Motley Fool",
      publisher_monogram: "MF",
      publisher_bg_hex: "#7C3AED",
      publisher_fg_hex: "#FFFFFF",
      published_label: "2h ago",
      published_utc: "2026-10-24T13:00:00Z",
      title: "Apple Vision & global streaming slate top weekend box-office and subscriber projections",
      summary:
        "Hardware ecosystem services revenue grows 14% YoY ahead of holiday quarter product cycle.",
      primary_ticker: "AAPL",
      asset_class: "EQUITY",
      sentiment_label: "Bullish",
      source_url: "https://www.fool.com",
      auto_platform: PLATFORM_REGISTRY.plat_schwab,
      workflow_prompt: "Sell 50% of my TSLA position if EV delivery news turns bearish or stock falls 4%",
      alert_prompt: "Send me an email if AAPL drops below its 20-day moving average on high volume",
    },
  ];

  const filtered = articles.filter(
    (a) =>
      (category === "global" || a.category === category) &&
      (!ticker || ticker === "ALL" || a.primary_ticker.toUpperCase() === ticker.toUpperCase())
  );
  return filtered.length > 0 ? filtered : articles;
}

export function getInitialWorkspaceState(): {
  portfolio: PortfolioSummaryState;
  strategies: ActiveStrategyState[];
  alerts: SmartNoticeDiagramSpec[];
  receipts: ActivityReceiptRecord[];
} {
  const wf1 = compileNaturalLanguageQuery("Buy NVDA when AI news is bullish", "PAPER").workflow_diagram!;
  const wf2 = compileNaturalLanguageQuery(
    "Buy $300 of Fed Rate Cut YES shares if US CPI inflation comes in below 2.5%",
    "LIVE"
  ).workflow_diagram!;
  const nt1 = compileNaturalLanguageQuery(
    "Notify me when BTC moves 4% in 1 hour or breaking Bitcoin ETF news drops",
    "PAPER"
  ).notice_diagram!;

  return {
    portfolio: {
      total_equity_usd: "144,170.00",
      available_spendable_usd: "94,620.00",
      reserved_funds_usd: "1,300.00",
      marked_holdings_usd: "48,250.00",
      realized_pnl_usd: "+$4,280.50",
      unrealized_pnl_usd: "+$6,910.25",
      unitized_twr_pct: "+14.82%",
      active_strategies_count: 2,
      active_alerts_count: 3,
      connected_platforms_count: listAllPlatforms().length,
    },
    strategies: [
      {
        strategy_id: wf1.strategy_id,
        title: wf1.title,
        thesis_summary: wf1.thesis_summary,
        version: 1,
        environment: "PAPER",
        status: "Paper active",
        platform: wf1.action.platform,
        symbol: wf1.action.symbol,
        side: wf1.action.side,
        allocated_budget_usd: wf1.action.notional_usd,
        unitized_pnl_pct: "+6.42%",
        unitized_pnl_usd: "+$32.10",
        semantic_hash: wf1.semantic_hash,
        authorization_epoch: 1,
        last_evaluated_label: "12s ago · Watching AI News",
        diagram: wf1,
      },
      {
        strategy_id: wf2.strategy_id,
        title: wf2.title,
        thesis_summary: wf2.thesis_summary,
        version: 2,
        environment: "LIVE",
        status: "Active",
        platform: wf2.action.platform,
        symbol: wf2.action.symbol,
        side: wf2.action.side,
        allocated_budget_usd: wf2.action.notional_usd,
        unitized_pnl_pct: "+11.80%",
        unitized_pnl_usd: "+$35.40",
        semantic_hash: wf2.semantic_hash,
        authorization_epoch: 1,
        last_evaluated_label: "8s ago · CPI Feed Armed",
        diagram: wf2,
      },
    ],
    alerts: [nt1],
    receipts: [
      {
        receipt_id: "rcpt_init_nvda_01",
        timestamp_utc: "2026-10-24T14:52:10Z",
        event_type: "STRATEGY_ACTIVATED",
        title: "Activated Workflow: BUY NVDA on Alpaca",
        subtitle: "Trigger: AI News Sentiment = Bullish · Atomic Cash Reserved ($500.00)",
        environment: "PAPER",
        platform: PLATFORM_REGISTRY.plat_alpaca,
        symbol: "NVDA",
        notional_usd: "500.00",
        order_state: "Armed & Monitoring (Reservation Locked)",
        correlation_id: "corr_99812a7f",
        semantic_hash: wf1.semantic_hash,
        client_order_id: "clord_nvda_alpaca_001",
        evidence_summary: "NVDA Live Market Price $211.11 (+4.16%) · AI & Semiconductors News = Bullish",
        postings: [
          {
            account_code: "acct:strategy_subledger:reserved_cash",
            side: "DEBIT",
            amount_usd: "500.00",
            instrument_symbol: "USD",
          },
          {
            account_code: "acct:alpaca:unreserved_buying_power",
            side: "CREDIT",
            amount_usd: "500.00",
            instrument_symbol: "USD",
          },
        ],
      },
    ],
  };
}

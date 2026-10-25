import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { loadSecrets } from "@/lib/secrets";

const CACHE_DIR = path.resolve(process.cwd(), "public/assets/logos/cache");

const BUILTIN_SVGS: Record<string, string> = {
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0F1419"/><path d="M36.6 28.4L49.8 13h-3.1L35.2 26.4 26.1 13H15.5l13.9 20.2L15.5 49h3.1l12.1-14.1L40.4 49H51L36.6 28.4zm-4.3 5l-1.4-2L19.8 15.3h4.8l9 12.9 1.4 2 11.7 16.7h-4.8L32.3 33.4z" fill="#FFFFFF"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0F1419"/><path d="M36.6 28.4L49.8 13h-3.1L35.2 26.4 26.1 13H15.5l13.9 20.2L15.5 49h3.1l12.1-14.1L40.4 49H51L36.6 28.4zm-4.3 5l-1.4-2L19.8 15.3h4.8l9 12.9 1.4 2 11.7 16.7h-4.8L32.3 33.4z" fill="#FFFFFF"/></svg>`,
  btc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#F7931A"/><path d="M43.4 27.9c.6-4.1-2.5-6.3-6.8-7.8l1.4-5.6-3.4-.8-1.3 5.4c-.9-.2-1.8-.4-2.7-.6l1.4-5.5-3.4-.8-1.4 5.6c-.7-.2-1.5-.3-2.2-.5l-4.7-1.2-.9 3.6s2.5.6 2.5.6c1.4.3 1.6 1.2 1.6 2l-1.6 6.4c.1 0 .2.1.4.1l-.4-.1-2.2 8.9c-.2.4-.6 1.1-1.6.8 0 0-2.5-.6-2.5-.6l-1.7 3.9 4.4 1.1c.8.2 1.6.4 2.4.6l-1.4 5.7 3.4.8 1.4-5.6c.9.2 1.8.5 2.7.7l-1.4 5.5 3.4.8 1.4-5.6c5.8 1.1 10.2.7 12-4.6 1.5-4.2-.1-6.7-3.1-8.3 2.2-.5 3.9-2 4.3-5zm-7.8 10.9c-1.1 4.3-8.3 2-10.6 1.4l1.9-7.6c2.3.6 9.8 1.7 8.7 6.2zm1.1-11c-1 3.9-7 1.9-9 1.4l1.7-6.9c2 .5 8.3 1.4 7.3 5.5z" fill="#FFFFFF"/></svg>`,
  eth: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#627EEA"/><path d="M32 10l-14 23.2L32 41.5l14-8.3L32 10zm0 34.3L18 36l14 18 14-18-14 8.3z" fill="#FFFFFF"/></svg>`,
  sol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#141414"/><path d="M18 40.5h24.5l3.5 4.5H21.5L18 40.5zm3.5-11h24.5L42.5 34H18l3.5-4.5zm-3.5-11h24.5l3.5 4.5H21.5L18 18.5z" fill="#14F195"/></svg>`,
  news: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#171717"/><path d="M18 20h28v4H18v-4zm0 10h20v4H18v-4zm0 10h28v4H18v-4z" fill="#FFFFFF"/></svg>`,
};

const KNOWN_DOMAINS: Record<string, string> = {
  DELL: "dell.com",
  NVDA: "nvidia.com",
  AMD: "amd.com",
  TSLA: "tesla.com",
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  META: "meta.com",
  GOOGL: "google.com",
  AMZN: "amazon.com",
  PLTR: "palantir.com",
  COIN: "coinbase.com",
  MSTR: "strategy.com",
  DJT: "truthsocial.com",
  INTC: "intel.com",
  AVGO: "broadcom.com",
  TSM: "tsmc.com",
  ORCL: "oracle.com",
  SMCI: "supermicro.com",
  SPY: "ssga.com",
  QQQ: "invesco.com",
  GLD: "spdrgoldshares.com",
  SMH: "vaneck.com",
  TLT: "ishares.com",
  USO: "uscfinvestments.com",
  XOM: "exxonmobil.com",
  CVX: "chevron.com",
  OXY: "oxy.com",
  XLE: "ssga.com",
  SCO: "proshares.com",
  PAXG: "paxos.com",
  POWR: "powerledger.io",
  ONDO: "ondo.finance",
  RENDER: "rendernetwork.com",
  FET: "fetch.ai",
  OIL: "cmegroup.com",
  MIDEAST: "polymarket.com",
  KXOIL: "kalshi.com",
  KXCPI: "kalshi.com",
  KXRECESSION: "kalshi.com",
  FED: "polymarket.com",
};

function sanitizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function makeMonogramSvg(label: string): string {
  const clean = label.toUpperCase().slice(0, 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#171717"/><text x="32" y="38" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" font-weight="700" fill="#FFFFFF">${clean}</text></svg>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbolRaw = (searchParams.get("symbol") || "").trim();
  const sourceRaw = (searchParams.get("source") || "").trim();

  // 1. Check if this is a Signal Source request (e.g. X/Twitter, Polymarket, Kalshi, News)
  if (sourceRaw) {
    const sLower = sourceRaw.toLowerCase();
    if (
      sLower.includes("twitter") ||
      sLower.includes("x (twitter)") ||
      sLower.includes("x/") ||
      sLower === "x" ||
      sLower.includes("tweet")
    ) {
      return new NextResponse(BUILTIN_SVGS.x, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    if (sLower.includes("truth social")) {
      try {
        const res = await fetch(
          "https://www.google.com/s2/favicons?domain=truthsocial.com&sz=128"
        );
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          return new NextResponse(buf, {
            headers: {
              "Content-Type": res.headers.get("content-type") || "image/png",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      } catch {
        // Fallback below
      }
    }
    return new NextResponse(BUILTIN_SVGS.news, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // 2. Symbol / Asset Logo Resolution
  const cleanSym = symbolRaw.toUpperCase().split("-")[0];
  if (!cleanSym) {
    return new NextResponse(BUILTIN_SVGS.news, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  if (cleanSym === "BTC") {
    return new NextResponse(BUILTIN_SVGS.btc, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  }
  if (cleanSym === "ETH" || cleanSym === "WETH") {
    return new NextResponse(BUILTIN_SVGS.eth, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  }
  if (cleanSym === "SOL") {
    return new NextResponse(BUILTIN_SVGS.sol, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  }

  const safeKey = sanitizeKey(cleanSym);
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    for (const ext of ["png", "svg", "jpeg", "jpg"]) {
      const candidate = path.join(CACHE_DIR, `${safeKey}.${ext}`);
      if (fs.existsSync(candidate)) {
        const bytes = fs.readFileSync(candidate);
        const mime =
          ext === "svg"
            ? "image/svg+xml"
            : ext === "png"
            ? "image/png"
            : "image/jpeg";
        return new NextResponse(bytes, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }
  } catch {
    // Continue to network fetch if filesystem read fails
  }

  const { polygonApiKey } = loadSecrets();
  let homepageDomain = KNOWN_DOMAINS[cleanSym] || "";

  // 2a. Try Polygon.io Company Branding API first (authenticates with polygonApiKey and caches locally)
  if (polygonApiKey) {
    try {
      const refRes = await fetch(
        `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(cleanSym)}?apiKey=${polygonApiKey}`,
        { signal: AbortSignal.timeout(2500) }
      );
      if (refRes.ok) {
        const refJson = await refRes.json();
        const results = refJson?.results || {};
        const branding = results?.branding || {};
        const homepageUrl: string = results?.homepage_url || "";
        if (homepageUrl && !homepageDomain) {
          try {
            homepageDomain = new URL(homepageUrl).hostname.replace(/^www\./, "");
          } catch {
            // ignore URL parse error
          }
        }
        const iconUrl: string = branding.icon_url || branding.logo_url || "";
        if (iconUrl) {
          const imgRes = await fetch(`${iconUrl}?apiKey=${polygonApiKey}`, {
            signal: AbortSignal.timeout(2500),
          });
          if (imgRes.ok) {
            const cType = imgRes.headers.get("content-type") || "image/png";
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.length > 100) {
              const ext = cType.includes("svg")
                ? "svg"
                : cType.includes("jpeg") || cType.includes("jpg")
                ? "jpeg"
                : "png";
              try {
                fs.writeFileSync(path.join(CACHE_DIR, `${safeKey}.${ext}`), buf);
              } catch {
                // ignore cache write error
              }
              return new NextResponse(buf, {
                headers: {
                  "Content-Type": cType,
                  "Cache-Control": "public, max-age=86400",
                },
              });
            }
          }
        }
      }
    } catch {
      // Fallback to public logo CDNs below
    }
  }

  // 2b. Try Parqet Symbol Logo CDN
  try {
    const pqRes = await fetch(
      `https://assets.parqet.com/logos/symbol/${encodeURIComponent(cleanSym)}?format=png`,
      { signal: AbortSignal.timeout(2200) }
    );
    if (pqRes.ok) {
      const buf = Buffer.from(await pqRes.arrayBuffer());
      if (buf.length > 100) {
        try {
          fs.writeFileSync(path.join(CACHE_DIR, `${safeKey}.png`), buf);
        } catch {
          // ignore
        }
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }
  } catch {
    // Fallback to Google High-Res Domain Icon below
  }

  // 2c. Try High-Res Domain Icon if domain is known
  if (homepageDomain) {
    try {
      const favRes = await fetch(
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(homepageDomain)}&sz=128`,
        { signal: AbortSignal.timeout(2200) }
      );
      if (favRes.ok) {
        const buf = Buffer.from(await favRes.arrayBuffer());
        if (buf.length > 100) {
          try {
            fs.writeFileSync(path.join(CACHE_DIR, `${safeKey}.png`), buf);
          } catch {
            // ignore
          }
          return new NextResponse(buf, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    } catch {
      // Fallback to monogram SVG below
    }
  }

  return new NextResponse(makeMonogramSvg(cleanSym), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

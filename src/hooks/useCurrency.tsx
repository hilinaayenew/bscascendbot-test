import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type CurrencyInfo = {
  code: string;
  symbol: string;
  rate: number; // rate from USD -> code
};

type CurrencyContextValue = {
  detected: CurrencyInfo | null;
  active: CurrencyInfo; // currently displayed currency
  useLocal: boolean;
  setUseLocal: (v: boolean) => void;
  loading: boolean;
  format: (usd: number, opts?: { suffix?: string }) => string;
};

const USD: CurrencyInfo = { code: "USD", symbol: "$", rate: 1 };

// Minimal country -> currency map (covers African focus + common cases)
const COUNTRY_CURRENCY: Record<string, string> = {
  NG: "NGN", KE: "KES", ZA: "ZAR", GH: "GHS", EG: "EGP", MA: "MAD", TN: "TND",
  DZ: "DZD", UG: "UGX", TZ: "TZS", RW: "RWF", ET: "ETB", SN: "XOF", CI: "XOF",
  CM: "XAF", ZM: "ZMW", ZW: "ZWL", BW: "BWP", NA: "NAD", MZ: "MZN", AO: "AOA",
  GB: "GBP", IE: "EUR", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", PT: "EUR",
  NL: "EUR", BE: "EUR", US: "USD", CA: "CAD", AU: "AUD", NZ: "NZD", IN: "INR",
  CN: "CNY", JP: "JPY", BR: "BRL", MX: "MXN", AE: "AED", SA: "SAR", CH: "CHF",
  SE: "SEK", NO: "NOK", DK: "DKK",
};

const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹",
  NGN: "₦", KES: "KSh", ZAR: "R", GHS: "₵", EGP: "E£", MAD: "DH",
  TND: "DT", DZD: "DA", UGX: "USh", TZS: "TSh", RWF: "FRw", ETB: "Br",
  XOF: "CFA", XAF: "FCFA", ZMW: "ZK", ZWL: "Z$", BWP: "P", NAD: "N$",
  MZN: "MT", AOA: "Kz", CAD: "C$", AUD: "A$", NZD: "NZ$", BRL: "R$",
  MXN: "Mex$", AED: "د.إ", SAR: "﷼", CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr",
};

const STORAGE_KEY = "currency-use-local";

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [detected, setDetected] = useState<CurrencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [useLocal, setUseLocalState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  const setUseLocal = (v: boolean) => {
    setUseLocalState(v);
    try { window.localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* noop */ }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        if (!geoRes.ok) throw new Error("geo failed");
        const geo = await geoRes.json();
        const country: string | undefined = geo?.country_code || geo?.country;
        const code = (country && COUNTRY_CURRENCY[country.toUpperCase()]) || "USD";
        if (code === "USD") {
          if (!cancelled) setDetected(USD);
          return;
        }
        const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const rateJson = await rateRes.json();
        const rate = rateJson?.rates?.[code];
        if (!cancelled) {
          if (typeof rate === "number" && rate > 0) {
            setDetected({ code, symbol: SYMBOLS[code] || code + " ", rate });
          } else {
            setDetected(USD);
          }
        }
      } catch {
        if (!cancelled) setDetected(USD);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const active = useMemo<CurrencyInfo>(() => {
    if (useLocal && detected) return detected;
    return USD;
  }, [useLocal, detected]);

  const format = (usd: number) => {
    const converted = usd * active.rate;
    // Round sensibly: small subscriptions keep precision; larger amounts round to whole units
    let display: string;
    if (active.code === "USD") {
      display = Number.isInteger(usd) ? String(usd) : usd.toFixed(2);
    } else if (converted < 10) {
      display = converted.toFixed(2);
    } else if (converted < 1000) {
      display = Math.round(converted).toString();
    } else {
      display = Math.round(converted).toLocaleString();
    }
    const sym = active.symbol;
    // Place symbol before number for most, after for code-style symbols
    const needsSpace = sym.length > 1 && !/[$£€¥₦₵₹]/.test(sym);
    return `${sym}${needsSpace ? " " : ""}${display}`;
  };

  return (
    <CurrencyContext.Provider value={{ detected, active, useLocal, setUseLocal, loading, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
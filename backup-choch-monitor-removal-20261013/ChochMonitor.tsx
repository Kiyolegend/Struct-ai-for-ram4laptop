/**
 * ChochMonitor — invisible background component.
 * Polls /trading-api/choch for 1H and 4H on enabled symbols every 60s.
 * Fires browser notification + toast whenever a NEW CHoCH appears.
 * Seeds silently on first mount — no startup spam.
 */

import { useEffect, useMemo, useRef } from "react";
import { useChoch, useBrokerTime, type ChochEvent } from "@/hooks/use-trading-api";
import { useToast } from "@/hooks/use-toast";
import { addChochAlert, setBrokerNow } from "@/hooks/use-choch-alerts";
import { useSymbolSettings } from "@/hooks/use-symbol-settings";

function fmt(p: number): string {
  return p > 50 ? p.toFixed(3) : p.toFixed(5);
}

function playAlert() {
  if (localStorage.getItem("struct_sound_muted") === "true") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

function fireSystemNotification(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    try { new Notification(title, { body, silent: false }); } catch {}
  }
}

export function ChochMonitor() {
  const { toast } = useToast();
  const { activeSymbols, isLoading: settingsLoading } = useSymbolSettings();
  const monitored = (symbol: string) => !settingsLoading && activeSymbols.includes(symbol);
  const { data: brokerTimeData } = useBrokerTime();
  useEffect(() => {
  if (brokerTimeData?.broker_time) setBrokerNow(brokerTimeData.broker_time);
}, [brokerTimeData]);
  const permRequested = useRef(false);

  // Keep hooks static; use enabled flags so inactive symbols are not polled.
  const d1_1h  = useChoch("USD/JPY", "1h", monitored("USD/JPY"));
  const d1_4h  = useChoch("USD/JPY", "4h", monitored("USD/JPY"));
  const d2_1h  = useChoch("EUR/USD", "1h", monitored("EUR/USD"));
  const d2_4h  = useChoch("EUR/USD", "4h", monitored("EUR/USD"));
  const d3_1h  = useChoch("GBP/USD", "1h", monitored("GBP/USD"));
  const d3_4h  = useChoch("GBP/USD", "4h", monitored("GBP/USD"));
  const d4_1h  = useChoch("AUD/USD", "1h", monitored("AUD/USD"));
  const d4_4h  = useChoch("AUD/USD", "4h", monitored("AUD/USD"));
  const d5_1h  = useChoch("USD/CHF", "1h", monitored("USD/CHF"));
  const d5_4h  = useChoch("USD/CHF", "4h", monitored("USD/CHF"));
  const d6_1h  = useChoch("EUR/JPY", "1h", monitored("EUR/JPY"));
  const d6_4h  = useChoch("EUR/JPY", "4h", monitored("EUR/JPY"));
  const d7_1h  = useChoch("GBP/JPY", "1h", monitored("GBP/JPY"));
  const d7_4h  = useChoch("GBP/JPY", "4h", monitored("GBP/JPY"));
  const d8_1h  = useChoch("USD/CAD", "1h", monitored("USD/CAD"));
  const d8_4h  = useChoch("USD/CAD", "4h", monitored("USD/CAD"));
  const d9_1h  = useChoch("NZD/USD", "1h", monitored("NZD/USD"));
  const d9_4h  = useChoch("NZD/USD", "4h", monitored("NZD/USD"));
  const d10_1h = useChoch("AUD/JPY", "1h", monitored("AUD/JPY"));
  const d10_4h = useChoch("AUD/JPY", "4h", monitored("AUD/JPY"));
  const d11_1h = useChoch("CAD/JPY", "1h", monitored("CAD/JPY"));
  const d11_4h = useChoch("CAD/JPY", "4h", monitored("CAD/JPY"));
  const d12_1h = useChoch("DXY", "1h", monitored("DXY"));
  const d12_4h = useChoch("DXY", "4h", monitored("DXY"));
  const d13_1h = useChoch("XAU/USD", "1h", monitored("XAU/USD"));
  const d13_4h = useChoch("XAU/USD", "4h", monitored("XAU/USD"));
  const d14_1h = useChoch("BTC/USD", "1h", monitored("BTC/USD"));
  const d14_4h = useChoch("BTC/USD", "4h", monitored("BTC/USD"));

  const allData = useMemo(() => ({
    "USD/JPY_1h": d1_1h.data,   "USD/JPY_4h": d1_4h.data,
    "EUR/USD_1h": d2_1h.data,   "EUR/USD_4h": d2_4h.data,
    "GBP/USD_1h": d3_1h.data,   "GBP/USD_4h": d3_4h.data,
    "AUD/USD_1h": d4_1h.data,   "AUD/USD_4h": d4_4h.data,
    "USD/CHF_1h": d5_1h.data,   "USD/CHF_4h": d5_4h.data,
    "EUR/JPY_1h": d6_1h.data,   "EUR/JPY_4h": d6_4h.data,
    "GBP/JPY_1h": d7_1h.data,   "GBP/JPY_4h": d7_4h.data,
    "USD/CAD_1h": d8_1h.data,   "USD/CAD_4h": d8_4h.data,
    "NZD/USD_1h": d9_1h.data,   "NZD/USD_4h": d9_4h.data,
    "AUD/JPY_1h": d10_1h.data,  "AUD/JPY_4h": d10_4h.data,
    "CAD/JPY_1h": d11_1h.data,  "CAD/JPY_4h": d11_4h.data,
    "DXY_1h": d12_1h.data,      "DXY_4h": d12_4h.data,
    "XAU/USD_1h": d13_1h.data, "XAU/USD_4h": d13_4h.data,
    "BTC/USD_1h": d14_1h.data, "BTC/USD_4h": d14_4h.data,
  }), [
    d1_1h.data,  d1_4h.data,  d2_1h.data,  d2_4h.data,
    d3_1h.data,  d3_4h.data,  d4_1h.data,  d4_4h.data,
    d5_1h.data,  d5_4h.data,  d6_1h.data,  d6_4h.data,
    d7_1h.data,  d7_4h.data,  d8_1h.data,  d8_4h.data,
    d9_1h.data,  d9_4h.data,  d10_1h.data, d10_4h.data,
    d11_1h.data, d11_4h.data, d12_1h.data, d12_4h.data,
    d13_1h.data, d13_4h.data, d14_1h.data, d14_4h.data,
  ]);

  // seenRef tracks the last CHoCH timestamp seen per key
  const seenRef        = useRef<Record<string, number>>({});
  const initializedRef = useRef<Record<string, boolean>>({});

  // Request browser notification permission once
  useEffect(() => {
    if (!permRequested.current && typeof Notification !== "undefined" && Notification.permission === "default") {
      permRequested.current = true;
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    for (const [key, data] of Object.entries(allData)) {
      const symbol = key.slice(0, key.lastIndexOf("_"));
      if (settingsLoading || !activeSymbols.includes(symbol)) continue;
      if (!data || !Array.isArray(data.choch) || data.choch.length === 0) continue;

      // Engine returns events sorted ascending — last = most recent
      const latest: ChochEvent = data.choch[data.choch.length - 1];
      const latestTime = latest.time;

      // First load — seed silently, do not fire
      if (!initializedRef.current[key]) {
        initializedRef.current[key] = true;
        seenRef.current[key] = latestTime;
        continue;
      }

      // New CHoCH — fire alert
      if (latestTime > (seenRef.current[key] ?? 0)) {
        seenRef.current[key] = latestTime;

        const tf = key.slice(key.lastIndexOf("_") + 1);
        const isBull         = latest.direction === "bullish";
        const emoji          = isBull ? "🟢" : "🔴";
        const dirLabel       = isBull ? "BULLISH" : "BEARISH";
        const nowSec = brokerTimeData?.broker_time ?? Math.floor(Date.now() / 1000);
        const ageSec         = nowSec - latestTime;
        const validitySec    = tf === "1h" ? 8 * 3600 : 48 * 3600;
        const remainingSec   = validitySec - ageSec;
        const ageStr         = ageSec < 3600
          ? `${Math.floor(ageSec / 60)}m ago`
          : `${(ageSec / 3600).toFixed(1)}h ago`;
        const validStr       = remainingSec > 0
          ? `${Math.floor(remainingSec / 3600)}h ${Math.floor((remainingSec % 3600) / 60)}m left`
          : "⚠ EXPIRED";
        const title          = `${emoji} CHoCH — ${symbol} ${tf.toUpperCase()} · ${ageStr}`;
        const body           = `${dirLabel} shift at ${fmt(latest.price)} — ${latest.broken_label} broken · ${validStr}`;

        playAlert();
        fireSystemNotification(title, body);
        addChochAlert({
          id: `${symbol}_${tf}_${latestTime}`,
          symbol, tf: tf as "1h" | "4h",
          direction: latest.direction,
          price: latest.price,
          brokenLabel: latest.broken_label,
          firedAt: latestTime,
          expiresAt: latestTime + validitySec,
        });
      }
    }
  }, [allData, activeSymbols, settingsLoading, toast]);

  return null;
}

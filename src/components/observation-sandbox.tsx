"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { WeatherCondition } from "@/core/types";
import { SF_RAIN_SCENARIO } from "@/core/scenario";
import { SkyCover } from "./sky-cover";
import { StatusStamp } from "./status-stamp";

/** Sky cover each condition implies, so the picker reads as a station plot. */
const skyCover: Record<WeatherCondition, number> = {
  clear: 0, haze: 0.25, windy: 0.25, cloudy: 0.5, fog: 0.5, rain: 1, snow: 1, storm: 1,
};

const WorldIdWidget = dynamic(() => import("./world-id-widget"), { ssr: false });
const LeafletObserverMap = dynamic(() => import("./leaflet-observer-map"), {
  ssr: false,
  loading: () => <div className="observer-map-loading">Preparing field map…</div>,
});
const STORAGE_KEY = "groundsignal.demo.v1";

interface LocationState { latitude: number; longitude: number; accuracy?: number; label: string }

export function ObservationSandbox({ mode, worldIdConfigured }: { mode: "demo" | "sqlite"; worldIdConfigured: boolean }) {
  const [condition, setCondition] = useState<WeatherCondition>("rain");
  const [intensity, setIntensity] = useState<"light" | "moderate" | "heavy">("moderate");
  const [feel, setFeel] = useState<"cold" | "cool" | "mild" | "warm">("cool");
  const [note, setNote] = useState("");
  const [verified, setVerified] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    latitude: SF_RAIN_SCENARIO.latitude,
    longitude: SF_RAIN_SCENARIO.longitude,
    label: "Demo location · San Francisco",
  });
  const [status, setStatus] = useState<{ tone: "info" | "error"; message: string } | null>(null);

  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus({ tone: "info", message: "This browser does not offer location. The demo location stays selected." });
      return;
    }
    setStatus({ tone: "info", message: "Requesting location…" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (position.coords.accuracy > 2_000) {
          setStatus({ tone: "info", message: `Accuracy is ±${Math.round(position.coords.accuracy)} m, wider than the 2,000 m limit. The demo location stays selected.` });
          return;
        }
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, label: `Current location · ±${Math.round(position.coords.accuracy)} m` });
        setStatus({ tone: "info", message: "Location acquired. Coordinates are used for this submission only and are never stored." });
      },
      () => setStatus({ tone: "info", message: "Location was denied or timed out. The demo location stays selected." }),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "demo") {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        observerId: "demo_observer_visitor",
        scenarioId: SF_RAIN_SCENARIO.id,
        cursor: SF_RAIN_SCENARIO.events.length - 1,
        reducedMotion: current.reducedMotion ?? false,
        visitorReport: {
          id: "visitor_demo_report",
          observerId: "demo_observer_visitor",
          source: "visitor_demo",
          h3Index: SF_RAIN_SCENARIO.h3Index,
          windowStart: SF_RAIN_SCENARIO.windowStart,
          observedAt: "2026-02-07T18:17:00.000Z",
          receivedAt: "2026-02-07T18:17:01.000Z",
          condition, intensity, feel, note: note || undefined,
        },
      }));
      setStatus({ tone: "info", message: "Saved to this browser only. Open the field test to see the recalculated consensus." });
      return;
    }
    const response = await fetch("/api/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracyMeters: location.accuracy,
        condition, intensity, feel, note: note || undefined,
      }),
    });
    const body = await response.json() as { error?: { message?: string } };
    setStatus(response.ok
      ? { tone: "info", message: "Observation saved to the local SQLite repository." }
      : { tone: "error", message: body.error?.message ?? `The server rejected the observation with ${response.status} ${response.statusText}.` });
  }

  return (
    <form className="observe-sheet" onSubmit={submit}>
      <div className="observer-identity">
        <div><p className="eyebrow">Observer identity</p><h2>{verified ? "World ID observer" : "Demo observer"}</h2></div>
        <StatusStamp tone={verified ? "green" : "orange"}>{verified ? "VERIFIED" : "SIMULATED"}</StatusStamp>
        {mode === "sqlite" && worldIdConfigured && !verified ? <WorldIdWidget onVerified={() => setVerified(true)} /> : null}
        {mode === "sqlite" && !worldIdConfigured ? <p>World ID is not configured. Follow the Integration Lab setup before submitting.</p> : null}
      </div>

      <fieldset><legend>1 / Where are you observing?</legend>
        <div className="location-ticket"><div><strong>{location.label}</strong><small>Raw coordinates are never written to storage.</small></div><button className="button button-quiet" type="button" onClick={requestLocation}>Use my location</button></div>
        <LeafletObserverMap latitude={location.latitude} longitude={location.longitude} label={location.label} />
      </fieldset>

      <fieldset><legend>2 / What is happening?</legend>
        <div className="choice-grid">
          {(["clear", "cloudy", "rain", "snow", "fog", "storm", "windy", "haze"] as WeatherCondition[]).map((item) => (
            <button type="button" aria-pressed={condition === item} onClick={() => setCondition(item)} key={item}>
              <SkyCover fraction={skyCover[item]} size={17} tone={condition === item ? "ground" : "muted"} />
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="form-pair">
        <fieldset><legend>3 / Intensity</legend><div className="segmented">{(["light", "moderate", "heavy"] as const).map((item) => <button type="button" aria-pressed={intensity === item} onClick={() => setIntensity(item)} key={item}>{item}</button>)}</div></fieldset>
        <fieldset><legend>4 / How does it feel?</legend><div className="segmented">{(["cold", "cool", "mild", "warm"] as const).map((item) => <button type="button" aria-pressed={feel === item} onClick={() => setFeel(item)} key={item}>{item}</button>)}</div></fieldset>
      </div>

      <label className="note-field">Optional field note <span>{note.length}/280</span><textarea maxLength={280} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What evidence can another observer corroborate?" /></label>
      <button className="button button-primary submit-observation" disabled={mode === "sqlite" && !verified}>Submit {mode === "demo" ? "browser-local" : "verified"} observation</button>
      {status ? (
        <p
          className={status.tone === "error" ? "form-error" : "form-status"}
          role={status.tone === "error" ? "alert" : "status"}
        >{status.message}</p>
      ) : null}
    </form>
  );
}

import { NextRequest, NextResponse } from "next/server";

type Alert = { id: string; title: string; severity: "warning" | "watch" | "advisory"; description: string; expires?: string; source: string };
const timeout = (url: string, headers?: HeadersInit) => fetch(url, { headers, signal: AbortSignal.timeout(8000), cache: "no-store" });

function severity(value: string): Alert["severity"] {
  const text = value.toLowerCase();
  if (text.includes("warning") || text.includes("severe") || text.includes("extreme")) return "warning";
  if (text.includes("watch")) return "watch";
  return "advisory";
}

function conciseDescription(value?: string, fallback = "Official weather alert.") {
  if (!value) return fallback;
  const cleaned = value.replace(/\s+/g, " ").replace(/\bIssued by\b[\s\S]*/i, "").trim();
  if (!cleaned) return fallback;
  const firstSentences = cleaned.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  if (firstSentences.length <= 280) return firstSentences;
  return `${firstSentences.slice(0, 277).replace(/\s+\S*$/, "")}…`;
}

async function nws(lat: string, lon: string): Promise<Alert[]> {
  const response = await timeout(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, { "User-Agent": "Weatherly personal dashboard" });
  if (!response.ok) return [];
  const body = await response.json();
  return (body.features ?? []).map((item: { id: string; properties: Record<string, string> }) => ({
    id: `nws-${item.id}`, title: item.properties.event || "National Weather Service alert", severity: severity(item.properties.severity || item.properties.event || ""),
    description: conciseDescription(item.properties.headline || item.properties.description), expires: item.properties.expires, source: "U.S. National Weather Service"
  }));
}

async function canada(lat: string, lon: string): Promise<Alert[]> {
  const bbox = [Number(lon) - .35, Number(lat) - .25, Number(lon) + .35, Number(lat) + .25].join(",");
  const response = await timeout(`https://api.weather.gc.ca/collections/weather-alerts/items?bbox=${bbox}&f=json&limit=30`);
  if (!response.ok) return [];
  const body = await response.json();
  return (body.features ?? []).map((item: { id?: string; properties?: Record<string, string> }, index: number) => {
    const p = item.properties ?? {};
    return { id: `eccc-${item.id ?? index}`, title: p.alert_name_en || p.alert_short_name_en || "Environment Canada alert", severity: severity(p.alert_type || ""), description: conciseDescription(p.alert_text_en, `Official ${p.alert_type || "weather"} alert.`), expires: p.expiration_datetime, source: "Environment and Climate Change Canada" };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat"); const lon = searchParams.get("lon");
  if (!lat || !lon || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return NextResponse.json({ alerts: [] }, { status: 400 });
  const [us, ca] = await Promise.allSettled([nws(lat, lon), canada(lat, lon)]);
  return NextResponse.json({ alerts: [...(us.status === "fulfilled" ? us.value : []), ...(ca.status === "fulfilled" ? ca.value : [])] });
}

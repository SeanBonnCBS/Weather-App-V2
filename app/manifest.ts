import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Weatherly", short_name: "Weatherly", display: "standalone", start_url: "/", background_color: "#edf4f5", theme_color: "#19394e" }; }

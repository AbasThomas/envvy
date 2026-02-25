import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "envii",
    short_name: "envii",
    description: "GitHub of environment variables. Backup, version, and collaborate on .env files.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0891b2",
    lang: "en",
    categories: ["developer", "productivity", "security"],
  };
}

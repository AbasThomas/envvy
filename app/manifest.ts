import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Envvy",
    short_name: "Envvy",
    description: "Envvy: Secure Your Secrets, Envy the Ease. Open-source backup, versioning, and collaboration for .env files.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0891b2",
    lang: "en",
    categories: ["developer", "productivity", "security"],
  };
}

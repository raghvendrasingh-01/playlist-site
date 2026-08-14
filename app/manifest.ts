import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Night Drive",
    short_name: "Night Drive",
    description: "A cinematic Ferrari night-drive playlist experience.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#08090a",
    icons: [{ src: "/images/night-drive-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

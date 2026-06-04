import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Expander Tracker",
    short_name: "Expander",
    description: "A playful daily tracker for a child's expander treatment.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF9F4",
    theme_color: "#8B5CF6",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

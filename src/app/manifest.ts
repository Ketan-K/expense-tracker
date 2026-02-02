import { MetadataRoute } from "next";
import { theme } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: theme.brand.name,
    short_name: theme.brand.name,
    description: theme.brand.description,
    theme_color: theme.meta.themeColor,
    background_color: "#ffffff",
    display: "standalone",
    scope: "/",
    start_url: "/",
    orientation: "portrait",
    icons: [
      {
        src: theme.assets.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: theme.assets.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

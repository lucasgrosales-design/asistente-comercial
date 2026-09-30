import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asistente Comercial",
    short_name: "Asistente",
    description: "Seguimiento comercial simple: a quién atender y qué hacer después.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f7",
    theme_color: "#176b63",
    lang: "es-AR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
  };
}

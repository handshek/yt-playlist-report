import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("pages/Landing.tsx"),
  route("compare", "pages/CompareIndex.tsx"),
  route("compare/:comparisonSlug", "pages/Compare.tsx"),
  route("playlist/:playlistId", "pages/Report.tsx"),
] satisfies RouteConfig;

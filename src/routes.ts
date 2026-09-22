import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("pages/Landing.tsx"),
  route("about", "pages/About.tsx"),
  route("privacy", "pages/Privacy.tsx"),
  route("terms", "pages/Terms.tsx"),
  route("compare", "pages/CompareIndex.tsx"),
  route("compare/:comparisonSlug", "pages/Compare.tsx"),
  route("playlist/:playlistId", "pages/Report.tsx"),
  route("*", "pages/NotFound.tsx"),
] satisfies RouteConfig;

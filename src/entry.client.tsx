import { startTransition, StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

type ReactRouterWindow = Window & {
  __reactRouterContext: { isSpaMode: boolean };
};

startTransition(() => {
  const router = (
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );

  if (
    (window as unknown as ReactRouterWindow).__reactRouterContext.isSpaMode
  ) {
    // SPA fallback documents contain only the root shell, not matched route HTML.
    // ReactDOM accepts Document at runtime, while the installed types expose Element.
    createRoot(document as unknown as HTMLElement).render(router);
    return;
  }

  hydrateRoot(document, router);
});

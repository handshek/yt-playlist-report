import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// React 19 tolerates extension markup inside head/body, but not beside them.
for (const node of Array.from(document.documentElement.childNodes)) {
  if (node !== document.head && node !== document.body) {
    document.body.append(node);
  }
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});

import { getParityCase } from "@unison-ui/parity/registry";
import { useEffect } from "react";

// Route: /parity/<component>/<case>?scheme=light|dark. Follows the stage contract in
// packages/parity: a 390-wide stage with 16 padding, the subject top-left, then a ready signal.
export function ParityPage() {
  const [, , component = "", caseName = ""] = location.pathname.split("/");
  const scheme = new URLSearchParams(location.search).get("scheme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = scheme;

  const parityCase = getParityCase(component, caseName);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled) document.documentElement.dataset.parityReady = "";
        }),
      ),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!parityCase) return <p>unknown parity case</p>;
  return (
    <div
      data-testid="stage"
      style={{
        width: 390,
        padding: 16,
        boxSizing: "border-box",
        background: "var(--unison-color-surface)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
      }}
    >
      <parityCase.Subject {...parityCase.props} testID="subject" />
    </div>
  );
}

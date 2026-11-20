import { DemoItems } from "demo-content";
import { ScopedPanel, SettingsBar } from "./settings-bar";

export default function Page() {
  return (
    <main className="min-h-dvh bg-surface text-fg p-4 flex flex-wrap items-center gap-4">
      <DemoItems />
      <div data-testid="tw-box" className="size-24 rounded-md border border-border bg-accent" />
      <SettingsBar />
      <ScopedPanel />
    </main>
  );
}

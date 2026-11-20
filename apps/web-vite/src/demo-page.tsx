import { DemoItems } from "demo-content";
import { ScopedPanel, SettingsBar } from "./settings-bar";

export function DemoPage() {
  return (
    <main className="min-h-dvh bg-surface text-fg p-4 flex flex-wrap items-center gap-4">
      <DemoItems />
      <div data-testid="tw-box" className="size-24 rounded-md border border-border bg-accent" />
      <div data-testid="motion-probe" className="animate-scale-in size-4" />
      <div data-testid="light-surface" className="bg-surface size-4" />
      <div data-testid="dark-scope" data-theme="dark">
        <div data-testid="dark-scope-surface" className="bg-surface size-4" />
      </div>
      <div data-testid="default-scope" data-unison-theme="default">
        <div data-testid="default-scope-surface" className="bg-surface size-4" />
      </div>
      <SettingsBar />
      <ScopedPanel />
    </main>
  );
}

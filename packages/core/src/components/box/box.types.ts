import type { ReactNode } from "react";

export interface BoxProps {
  tone?: "accent" | "neutral";
  testID?: string; // web renders it as data-testid
  children?: ReactNode;
}

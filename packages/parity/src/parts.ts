import { createContext } from "react";

/** Native fixtures register their parts here; the parity route measures them against the stage. */
export interface PartsRegistry {
  register(name: string, view: unknown, sample: boolean): () => void;
}
export const PartsContext = createContext<PartsRegistry | null>(null);

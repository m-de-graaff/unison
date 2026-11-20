import { expect, it } from "vitest";
import { concentric } from "../src/concentric";

it("subtracts the padding", () => expect(concentric(16, 4)).toBe(12));
it("never goes below zero", () => expect(concentric(4, 8)).toBe(0));

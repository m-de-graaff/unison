import { motionPresets } from "@unison-ui/tokens/motion";
import { expect, it } from "vitest";
import { toWaapi } from "../src/web";

const p = motionPresets.default["scale-in"];
it("spring phases use linear() and the simulated duration", () => {
  const [frames, opts] = toWaapi(p, "enter");
  expect(frames).toEqual([
    { opacity: 0, transform: "scale(0.96)" },
    { opacity: 1, transform: "scale(1)" },
  ]);
  expect(opts).toMatchObject({ easing: expect.stringMatching(/^linear\(0, /), fill: "both" });
  expect(opts.duration).toBeGreaterThan(150);
});
it("timing phases use cubic-bezier", () => {
  expect(toWaapi(p, "exit")[1]).toMatchObject({
    duration: 80,
    easing: "cubic-bezier(0.3, 0, 0.8, 0.15)",
  });
});
it("reduced only fades", () => {
  const [frames, opts] = toWaapi(p, "enter", { reduced: true });
  expect(frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  expect(opts).toMatchObject({ duration: 120, easing: "linear" });
});
it("px and percentage translations become translateY()", () => {
  expect(toWaapi(motionPresets.default.sheet, "enter")[0]).toEqual([
    { transform: "translateY(100%)" },
    { transform: "translateY(0px)" },
  ]);
  expect(toWaapi(motionPresets.default["slide-up"], "exit")[0][1]).toEqual({
    opacity: 0,
    transform: "translateY(4px)",
  });
});
it.each(Object.keys(motionPresets.default) as (keyof typeof motionPresets.default)[])(
  "%s produces two frames for every phase and variant",
  (name) => {
    for (const phase of ["enter", "exit"] as const) {
      for (const reduced of [false, true]) {
        const [frames, opts] = toWaapi(motionPresets.default[name], phase, { reduced });
        expect(frames).toHaveLength(2);
        expect(opts.duration).toBeGreaterThanOrEqual(0);
      }
    }
  },
);

it("press has no reduced variant, so reduced keeps its scale", () => {
  const press = motionPresets.default.press;
  expect(toWaapi(press, "enter", { reduced: true })).toEqual(toWaapi(press, "enter"));
  expect(toWaapi(press, "enter", { reduced: true })[0]).toEqual([
    { transform: "scale(1)" },
    { transform: "scale(0.97)" },
  ]);
});

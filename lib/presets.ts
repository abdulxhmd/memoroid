export type FormatKey = "instax" | "polaroid";

export const PRESETS = {
    instax: {
        full: { w: 1016, h: 638 },    // full paper pixels at 300 DPI
        image: { w: 732, h: 543 },
        offset: { left: 142, top: 47 }
    },
    polaroid: {
        full: { w: 1270, h: 1045 },
        image: { w: 932, h: 907 },
        offset: { left: 169, top: 69 }
    }
} as const;

export const VALID_PRESETS = Object.keys(PRESETS) as FormatKey[];

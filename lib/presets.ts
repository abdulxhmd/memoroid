export type FormatKey = "landscape" | "portrait";

export const PRESETS = {
    landscape: {
        full: { w: 1016, h: 638 },    // full paper pixels at 300 DPI
        image: { w: 732, h: 543 },
        offset: { left: 142, top: 47 }
    },
    portrait: {
        full: { w: 1050, h: 1260 },
        image: { w: 930, h: 930 },
        offset: { left: 60, top: 60 }
    }
} as const;

export const VALID_PRESETS = Object.keys(PRESETS) as FormatKey[];

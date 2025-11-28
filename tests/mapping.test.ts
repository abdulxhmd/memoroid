import { mapClientToInternal, mapPreviewCropToOriginal } from "../lib/utils";

describe("mapClientToInternal", () => {
    it("maps center point correctly", () => {
        const rect = { left: 0, top: 0, width: 200, height: 100 } as DOMRect;
        const internalW = 1000;
        const internalH = 500;
        const res = mapClientToInternal(100, 50, rect, internalW, internalH);
        expect(res.x).toBe(500);
        expect(res.y).toBe(250);
    });

    it("clamps outside points", () => {
        const rect = { left: 0, top: 0, width: 200, height: 100 } as DOMRect;
        const res = mapClientToInternal(5000, 5000, rect, 1000, 500);
        expect(res.x).toBe(999);
        expect(res.y).toBe(499);
    });
});

describe("mapPreviewCropToOriginal", () => {
    it("maps preview crop to original accurately", () => {
        const preview = { x: 10, y: 20, width: 80, height: 40 };
        const previewSize = { w: 100, h: 50 };
        const originalSize = { w: 2000, h: 1000 };
        const mapped = mapPreviewCropToOriginal(preview, previewSize, originalSize);
        expect(mapped.x).toBe(200);
        expect(mapped.y).toBe(400);
        expect(mapped.width).toBe(1600);
        expect(mapped.height).toBe(800);
    });
});

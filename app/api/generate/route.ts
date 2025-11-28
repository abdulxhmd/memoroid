import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { PRESETS } from "../../../lib/presets";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const format = (formData.get("format") as string) || "landscape";
        if (!["landscape", "portrait"].includes(format)) {
            return new NextResponse("Invalid format", { status: 400 });
        }
        const preset = PRESETS[format as "landscape" | "portrait"];
        const cropData = JSON.parse(formData.get("cropData") as string || "{}");

        const caption = formData.get("caption") as string || "";
        const font = formData.get("font") as string || "AmaticSC";
        console.log("Received font parameter:", font);

        const fontSize = parseInt(formData.get("fontSize") as string || "30");
        const textPosStr = formData.get("textPos") as string;
        let textPos = textPosStr ? JSON.parse(textPosStr) : null;

        const photoFile = formData.get("photo") as File | null;
        if (!photoFile) return new NextResponse("Missing photo", { status: 400 });

        const overlayFile = formData.get("overlay") as File | null;

        const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

        const { x, y, width, height } = {
            x: Math.round(cropData.x),
            y: Math.round(cropData.y),
            width: Math.round(cropData.width),
            height: Math.round(cropData.height)
        };

        const extracted = await sharp(photoBuffer)
            .extract({ left: x, top: y, width, height })
            .resize(preset.image.w, preset.image.h, { fit: "cover" })
            .toBuffer();

        const background = sharp({
            create: {
                width: preset.full.w,
                height: preset.full.h,
                channels: 3,
                background: "#ffffff"
            }
        });

        let composed = await background
            .composite([{ input: extracted, left: preset.offset.left, top: preset.offset.top }])
            .png()
            .toBuffer();

        // Render Text if caption exists
        if (caption) {
            // Default position if not provided (center of the chin area)
            if (!textPos) {
                const bottomMargin = preset.full.h - (preset.offset.top + preset.image.h);
                const defaultY = preset.offset.top + preset.image.h + (bottomMargin / 2);
                textPos = { x: preset.full.w / 2, y: defaultY };
            }

            const fontMap: Record<string, string> = {
                "AmaticSC": "AmaticSC-Regular.ttf",
                "IndieFlower": "IndieFlower-Regular.ttf",
                "Caveat": "Caveat-Regular.ttf",
                "ShadowsIntoLight": "ShadowsIntoLight-Regular.ttf"
            };

            const fontFile = fontMap[font] || "AmaticSC-Regular.ttf";

            // Server-side: embed the TTF into the SVG (recommended)
            const USE_EMBEDDED_FONT = true;
            let fontCss = "";

            if (USE_EMBEDDED_FONT) {
                try {
                    const fontPath = path.join(process.cwd(), "public", "fonts", fontFile);
                    const fontBase64 = fs.readFileSync(fontPath).toString("base64");
                    const fontDataUrl = `data:font/ttf;base64,${fontBase64}`;
                    fontCss = `@font-face { font-family: 'CustomFont'; src: url('${fontDataUrl}') format('truetype'); }`;
                    console.log(`Font loaded and embedded: ${fontFile}`);
                } catch (e) {
                    console.warn("Could not embed font, falling back to sans-serif:", e);
                    fontCss = "";
                }
            } else {
                // fallback (not preferred) — leave for reference
                const fontPath = path.join(process.cwd(), "public", "fonts", fontFile);
                fontCss = `@font-face { font-family: 'CustomFont'; src: url('file://${fontPath}'); }`;
            }

            const svgImage = `
            <svg width="${preset.full.w}" height="${preset.full.h}" xmlns="http://www.w3.org/2000/svg">
                <style>
                    ${fontCss}
                    .caption {
                        font-family: "CustomFont", sans-serif;
                        font-size: ${fontSize}px;
                        fill: #111;
                        text-anchor: middle;
                        dominant-baseline: middle;
                    }
                </style>
                <rect width="100%" height="100%" fill="transparent" />
                <text x="${textPos.x}" y="${textPos.y}" class="caption">${escapeXml(String(caption || ""))}</text>
            </svg>
            `;

            // DEBUG: optional — log svg length and a small sample so you can inspect in logs
            console.log("SVG length:", svgImage.length);
            console.log("SVG sample:", svgImage.slice(0, 512));

            composed = await sharp(composed)
                .composite([{ input: Buffer.from(svgImage), blend: "over" }])
                .png()
                .toBuffer();
        }

        let composedWithOverlay = composed;

        if (overlayFile) {
            const overlayBuf = Buffer.from(await overlayFile.arrayBuffer());
            // Only composite if overlay has content (size > 0)
            if (overlayBuf.length > 0) {
                const overlayMeta = await sharp(overlayBuf).metadata();
                // Resize overlay if it doesn't match exactly (though it should from frontend)
                // or just composite it.
                if (overlayMeta.width === preset.full.w && overlayMeta.height === preset.full.h) {
                    composedWithOverlay = await sharp(composed)
                        .composite([{ input: overlayBuf, blend: "over" }])
                        .png()
                        .toBuffer();
                } else {
                    console.warn("Overlay size mismatch, skipping overlay or resizing needed.");
                }
            }
        }
        return new NextResponse(composedWithOverlay as any, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename = "memoroid_${format}_${Date.now()}.png"`
            }
        });
    } catch (err: any) {
        console.error(err);
        return new NextResponse("Server error: " + (err?.message || String(err)), { status: 500 });
    }
}

function escapeXml(str: string) {
    return str.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" }[c] || c));
}

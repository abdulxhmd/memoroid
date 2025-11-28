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
            const fontPath = path.join(process.cwd(), "public", "fonts", fontFile);
            console.log("Attempting to load font from:", fontPath);

            let fontBase64 = "";
            try {
                if (fs.existsSync(fontPath)) {
                    const fontBuffer = fs.readFileSync(fontPath);
                    fontBase64 = fontBuffer.toString("base64");
                    console.log(`Font loaded successfully. Size: ${fontBuffer.length} bytes. Base64 length: ${fontBase64.length}`);
                } else {
                    console.error("Font file not found at:", fontPath);
                }
            } catch (e) {
                console.error("Failed to load font:", e);
            }

            if (!fontBase64) {
                console.warn("FontBase64 is empty, text rendering may fail.");
            }

            const svgImage = `
            <svg width="${preset.full.w}" height="${preset.full.h}" xmlns="http://www.w3.org/2000/svg">
                <style>
                    @font-face {
                        font-family: "CustomFont";
                        src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
                    }
                    .caption {
                        font-family: "CustomFont", sans-serif;
                        font-size: ${fontSize}px;
                        fill: #111;
                        text-anchor: middle;
                        dominant-baseline: middle;
                    }
                </style>
                <text x="${textPos.x}" y="${textPos.y}" class="caption">${escapeXml(caption)}</text>
            </svg>
            `;

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

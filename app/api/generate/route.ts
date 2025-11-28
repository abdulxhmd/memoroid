import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { PRESETS } from "../../../lib/presets";

export const config = {
    api: {
        bodyParser: false
    }
};

function parseForm(req: any): Promise<{ fields: any; files: any }> {
    const form = formidable({
        multiples: false,
        maxFileSize: 12 * 1024 * 1024
    });
    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
}

export default async function handler(req: Request) {
    try {
        const { fields, files } = await parseForm((req as any));
        const format = (fields.format as string) || "instax";
        if (!["instax", "polaroid"].includes(format)) {
            return new NextResponse("Invalid format", { status: 400 });
        }
        const preset = PRESETS[format as "instax" | "polaroid"];
        const cropData = JSON.parse(fields.cropData as string || "{}");
        const caption = fields.caption || "";
        const date = fields.date || new Date().toISOString();

        if (!files.photo) return new NextResponse("Missing photo", { status: 400 });

        const photoPath = (files.photo as any).filepath || (files.photo as any).path;
        const overlayPath = (files.overlay as any)?.filepath || (files.overlay as any)?.path;

        const photoBuffer = fs.readFileSync(photoPath);

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

        const composed = await background
            .composite([{ input: extracted, left: preset.offset.left, top: preset.offset.top }])
            .png()
            .toBuffer();

        let composedWithOverlay = composed;

        if (overlayPath && fs.existsSync(overlayPath)) {
            const overlayBuf = fs.readFileSync(overlayPath);
            const overlayMeta = await sharp(overlayBuf).metadata();
            if (overlayMeta.width !== preset.full.w || overlayMeta.height !== preset.full.h) {
                return new NextResponse("Overlay size mismatch. Expected " + preset.full.w + "x" + preset.full.h, { status: 400 });
            }
            composedWithOverlay = await sharp(composed)
                .composite([{ input: overlayBuf, blend: "over" }])
                .png()
                .toBuffer();
        }

        const svg = `
      <svg width="${preset.full.w}" height="${preset.full.h}">
        <style>
          @font-face {
            font-family: 'AmaticSC';
            src: url('file://${path.join(process.cwd(), "public/fonts/AmaticSC-Regular.ttf")}');
          }
          .c { font-family: 'AmaticSC', sans-serif; font-size: ${Math.round(preset.full.h * 0.035)}px; fill:#111; text-anchor:middle; }
        </style>
        <text x="${preset.full.w / 2}" y="${preset.full.h - Math.round(preset.full.h * 0.06)}" class="c">${escapeXml(String(caption))}</text>
      </svg>
    `;
        const final = await sharp(composedWithOverlay)
            .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
            .png()
            .toBuffer();

        try {
            fs.unlinkSync(photoPath);
            if (overlayPath) fs.unlinkSync(overlayPath);
        } catch (e) { }

        return new NextResponse(final, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="memoroid_${format}_${Date.now()}.png"`
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

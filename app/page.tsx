"use client";
import React, { useRef, useState, useEffect } from "react";
import ImageCropper from "../components/ImageCropper";
import StylusCanvas from "../components/StylusCanvas";
import { useEditorStore } from "../components/EditorStateProvider";
import { PRESETS } from "../lib/presets";
import { mapPreviewCropToOriginal } from "../lib/utils";

export default function EditorPage() {
    const setFile = useEditorStore((s) => s.setFile);
    const file = useEditorStore((s) => s.file);
    const setOriginalImageSize = useEditorStore((s) => s.setOriginalImageSize);
    const cropData = useEditorStore((s) => s.cropData);
    const setCropData = useEditorStore((s) => s.setCropData);
    const format = useEditorStore((s) => s.format);
    const setFormat = useEditorStore((s) => s.setFormat);
    const caption = useEditorStore((s) => s.caption);
    const setCaption = useEditorStore((s) => s.setCaption);
    const drawingMode = useEditorStore((s) => s.drawingMode);
    const setDrawingMode = useEditorStore((s) => s.setDrawingMode);

    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [previewSize, setPreviewSize] = useState<{ w: number; h: number } | null>(null);
    const stylusRef = useRef<any>(null);
    const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
        return () => {
            if (previewSrc) URL.revokeObjectURL(previewSrc);
        };
    }, [previewSrc]);

    const handleFile = async (f?: File | null) => {
        setFile(f || null);
        if (!f) {
            setPreviewSrc(null);
            return;
        }
        const url = URL.createObjectURL(f);
        setPreviewSrc(url);
    };

    async function onCropComplete(previewCrop: { x: number; y: number; width: number; height: number }) {
        if (!originalSize || !previewSize) {
            setCropData(previewCrop);
            return;
        }
        const mapped = mapPreviewCropToOriginal(previewCrop, previewSize, originalSize);
        setCropData(mapped);
    }

    async function handleGenerate() {
        if (!file || !cropData) {
            alert("Please upload and crop your photo first.");
            return;
        }
        const overlayBlob = await stylusRef.current?.getOverlayBlob();
        const fd = new FormData();
        fd.append("photo", file);
        fd.append("overlay", overlayBlob, "overlay.png");
        fd.append("cropData", JSON.stringify(cropData));
        fd.append("format", format);
        fd.append("caption", caption || "");
        fd.append("date", new Date().toISOString());

        const res = await fetch("/api/generate", { method: "POST", body: fd });
        if (!res.ok) {
            const text = await res.text();
            alert("Generate failed: " + text);
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        sessionStorage.setItem("memoroid_result", url);
        window.location.href = "/download";
    }

    return (
        <div className="grid grid-cols-12 gap-6">
            <aside className="col-span-3">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-semibold">Tools</h3>
                    <div className="mt-3">
                        <label className="block">Upload</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                    </div>

                    <div className="mt-3">
                        <label>Format</label>
                        <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-full border rounded p-1">
                            <option value="instax">Instax Mini</option>
                            <option value="polaroid">Polaroid</option>
                        </select>
                    </div>

                    <div className="mt-3">
                        <label>Caption</label>
                        <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full border rounded p-1" />
                    </div>

                    <div className="mt-3">
                        <label>Drawing Mode</label>
                        <div className="flex items-center">
                            <input type="checkbox" checked={drawingMode} onChange={(e) => setDrawingMode(e.target.checked)} />
                            <span className="ml-2 text-sm">Enable drawing (pen/touch)</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="col-span-9">
                <div className="bg-white p-4 rounded-lg">
                    {!previewSrc && (
                        <div className="text-center py-16">
                            <p className="mb-4">Drop a photo or use the upload control.</p>
                        </div>
                    )}

                    {previewSrc && (
                        <>
                            <div className="mb-4">
                                <ImageCropper
                                    imageSrc={previewSrc}
                                    aspect={format === "instax" ? PRESETS.instax.image.w / PRESETS.instax.image.h : PRESETS.polaroid.image.w / PRESETS.polaroid.image.h}
                                    onCropComplete={(previewCrop) => {
                                        onCropComplete(previewCrop);
                                    }}
                                    onLoadOriginalSize={(s) => {
                                        setOriginalImageSize(s);
                                        setOriginalSize(s);
                                        setPreviewSize({ w: s.w, h: s.h });
                                    }}
                                />
                            </div>

                            <div>
                                <h4 className="mb-2">Draw (overlay)</h4>
                                <StylusCanvas
                                    ref={stylusRef}
                                    width={PRESETS[format].full.w}
                                    height={PRESETS[format].full.h}
                                    displayWidth={800}
                                    displayHeight={Math.round((PRESETS[format].full.h / PRESETS[format].full.w) * 800)}
                                    bgPreview={previewSrc}
                                    preferStylusOnly={false}
                                    drawingMode={drawingMode}
                                />
                            </div>

                            <div className="mt-4">
                                <button onClick={() => handleGenerate()} className="px-4 py-2 bg-primary text-white rounded">Generate Print-Ready File</button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

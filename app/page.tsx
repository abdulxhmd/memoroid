"use client";
import React, { useRef, useState, useEffect } from "react";
import ImageCropper from "../components/ImageCropper";
import StylusCanvas from "../components/StylusCanvas";
import { useEditorStore } from "../components/EditorStateProvider";
import { PRESETS } from "../lib/presets";
import { mapPreviewCropToOriginal } from "../lib/utils";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { MobileNav } from "../components/MobileNav";

import { DownloadModal } from "../components/DownloadModal";

function resizeImage(file: File, maxDim = 2000): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const scale = maxDim / Math.max(img.width, img.height);
            // If image is smaller than maxDim, don't upscale
            if (scale >= 1) {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
                canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
                return;
            }

            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, w, h);

            canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
        };
        img.src = URL.createObjectURL(file);
    });
}

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
    const font = useEditorStore((s) => s.font);
    const setFont = useEditorStore((s) => s.setFont);
    const drawingMode = useEditorStore((s) => s.drawingMode);
    const setDrawingMode = useEditorStore((s) => s.setDrawingMode);

    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [previewSize, setPreviewSize] = useState<{ w: number; h: number } | null>(null);
    const stylusRef = useRef<any>(null);
    const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);

    // New UI States
    const [darkMode, setDarkMode] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [opacity, setOpacity] = useState(100);
    const [color, setColor] = useState("#1A1A1A");
    const [fontSize, setFontSize] = useState(30);

    // Download State
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    // Calculate scaling for the preview area
    const preset = PRESETS[format] || PRESETS.landscape;
    const scale = 0.6; // Scale down for display
    const displayW = preset.full.w * scale;
    const displayH = preset.full.h * scale;

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

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

    // Text Dragging State
    const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
    const isDraggingText = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Reset text position when format changes
    useEffect(() => {
        const p = PRESETS[format] || PRESETS.landscape;
        const bottomMargin = p.full.h - (p.offset.top + p.image.h);
        const defaultY = p.offset.top + p.image.h + (bottomMargin / 2);
        setTextPos({ x: p.full.w / 2, y: defaultY });
    }, [format]);

    const handleTextPointerDown = (e: React.PointerEvent) => {
        if (!textPos) return;
        e.stopPropagation();
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        isDraggingText.current = true;

        // Calculate offset from the text center to the pointer
        // We need to convert pointer client coords to our internal scale
        const rect = target.getBoundingClientRect();
        // This is rough, but since we track center, let's just track delta
        dragOffset.current = { x: e.clientX, y: e.clientY };
    };

    const textRef = useRef<HTMLDivElement>(null);

    const handleTextPointerMove = (e: React.PointerEvent) => {
        if (!isDraggingText.current || !textPos) return;
        e.stopPropagation();
        e.preventDefault();

        const deltaX = (e.clientX - dragOffset.current.x) / scale;
        const deltaY = (e.clientY - dragOffset.current.y) / scale;

        dragOffset.current = { x: e.clientX, y: e.clientY };

        setTextPos(prev => {
            if (!prev) return null;
            const p = PRESETS[format] || PRESETS.landscape;
            const newX = prev.x + deltaX;
            const newY = prev.y + deltaY;

            // Get text dimensions in internal units
            let halfWidth = 0;
            let halfHeight = 0;
            if (textRef.current) {
                const rect = textRef.current.getBoundingClientRect();
                halfWidth = (rect.width / scale) / 2;
                halfHeight = (rect.height / scale) / 2;
            }

            // Constrain to chin area with padding
            // Ensure the edges of the text don't go beyond the frame
            const padding = 20;
            const minX = padding + halfWidth;
            const maxX = p.full.w - padding - halfWidth;

            const minY = p.offset.top + p.image.h + padding + halfHeight;
            const maxY = p.full.h - padding - halfHeight;

            // If text is wider than frame, just center it or clamp to center
            const clampedX = minX > maxX ? p.full.w / 2 : Math.max(minX, Math.min(maxX, newX));
            const clampedY = minY > maxY ? (minY + maxY) / 2 : Math.max(minY, Math.min(maxY, newY));

            return {
                x: clampedX,
                y: clampedY
            };
        });
    };

    // Auto-clamp text when dimensions change (typing or resizing)
    useEffect(() => {
        if (!textPos || !textRef.current) return;

        const p = PRESETS[format] || PRESETS.landscape;
        const rect = textRef.current.getBoundingClientRect();
        const halfWidth = (rect.width / scale) / 2;
        const halfHeight = (rect.height / scale) / 2;

        const padding = 20;
        const minX = padding + halfWidth;
        const maxX = p.full.w - padding - halfWidth;

        const minY = p.offset.top + p.image.h + padding + halfHeight;
        const maxY = p.full.h - padding - halfHeight;

        setTextPos(prev => {
            if (!prev) return null;
            // Only update if out of bounds
            const clampedX = minX > maxX ? p.full.w / 2 : Math.max(minX, Math.min(maxX, prev.x));
            const clampedY = minY > maxY ? (minY + maxY) / 2 : Math.max(minY, Math.min(maxY, prev.y));

            if (clampedX !== prev.x || clampedY !== prev.y) {
                return { x: clampedX, y: clampedY };
            }
            return prev;
        });
    }, [caption, fontSize, format, scale, font]); // Dependencies that affect size

    const handleTextPointerUp = (e: React.PointerEvent) => {
        if (!isDraggingText.current) return;
        isDraggingText.current = false;
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture(e.pointerId);
    };

    async function handleGenerate() {
        if (!file || !cropData) {
            alert("Please upload and crop your photo first.");
            return;
        }
        const overlayBlob = await stylusRef.current?.getOverlayBlob();

        // Resize image before upload to avoid Vercel payload limits
        const resizedBlob = await resizeImage(file);

        const fd = new FormData();
        fd.append("photo", resizedBlob, file.name);
        if (overlayBlob) {
            fd.append("overlay", overlayBlob, "overlay.png");
        }
        fd.append("cropData", JSON.stringify(cropData));
        fd.append("format", format);
        fd.append("caption", caption || "");
        fd.append("font", font);
        fd.append("fontSize", fontSize.toString());
        if (textPos) {
            fd.append("textPos", JSON.stringify(textPos));
        }
        fd.append("date", new Date().toISOString());

        const res = await fetch("/api/generate", { method: "POST", body: fd });
        if (!res.ok) {
            const text = await res.text();
            alert("Generate failed: " + text);
            return;
        }
        const blob = await res.blob();
        const pngBlob = new Blob([blob], { type: "image/png" });
        const url = URL.createObjectURL(pngBlob);
        setGeneratedUrl(url);
    }



    return (
        <div className="flex flex-col h-screen bg-pastel-bg dark:bg-dark-bg transition-colors overflow-hidden">
            <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar - Hidden on Mobile */}
                <div className="hidden md:block h-full">
                    <Sidebar
                        onUpload={handleFile}
                        drawingMode={drawingMode}
                        setDrawingMode={setDrawingMode}
                        brushSize={brushSize}
                        setBrushSize={setBrushSize}
                        opacity={opacity}
                        setOpacity={setOpacity}
                        color={color}
                        setColor={setColor}
                        onUndo={() => stylusRef.current?.undo()}
                        onClear={() => stylusRef.current?.clear()}
                        onGenerate={handleGenerate}
                        caption={caption}
                        setCaption={setCaption}
                        font={font}
                        setFont={setFont}
                        fontSize={fontSize}
                        setFontSize={setFontSize}
                        format={format}
                        setFormat={(f) => setFormat(f)}
                    />
                </div>

                {/* Main Canvas Area */}
                <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
                    {!previewSrc ? (
                        <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-dark-surface/50">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-xl mx-auto mb-4 flex items-center justify-center">
                                <span className="text-4xl">🖼️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Drop your photo here</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">or use the upload button</p>
                        </div>
                    ) : (
                        <div
                            className="relative shadow-2xl transition-transform duration-300"
                            style={{
                                width: displayW,
                                height: displayH,
                                backgroundColor: "white",
                                transform: "scale(1)", // Could add zoom logic here
                                overflow: "hidden", // Clip content to frame
                            }}
                        >
                            {/* Layer 1: Photo Cropper Area */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: preset.offset.left * scale,
                                    top: preset.offset.top * scale,
                                    width: preset.image.w * scale,
                                    height: preset.image.h * scale,
                                    overflow: "hidden",
                                    backgroundColor: "white",
                                    pointerEvents: drawingMode ? "none" : "auto"
                                }}
                            >
                                <ImageCropper
                                    imageSrc={previewSrc}
                                    aspect={preset.image.w / preset.image.h}
                                    onCropComplete={onCropComplete}
                                    onLoadOriginalSize={(s) => {
                                        setOriginalImageSize(s);
                                        setOriginalSize(s);
                                        setPreviewSize({ w: s.w, h: s.h });
                                    }}
                                />
                            </div>

                            {/* Layer 2: Drawing Canvas */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    pointerEvents: drawingMode ? "auto" : "none",
                                    zIndex: 40, // Above text
                                    opacity: opacity / 100
                                }}
                            >
                                <StylusCanvas
                                    ref={stylusRef}
                                    width={preset.full.w}
                                    height={preset.full.h}
                                    displayWidth={displayW}
                                    displayHeight={displayH}
                                    bgPreview={null}
                                    preferStylusOnly={false}
                                    drawingMode={drawingMode}
                                    strokeColor={color}
                                    strokeWidth={brushSize}
                                    drawingArea={{
                                        y: preset.offset.top + preset.image.h,
                                        height: preset.full.h - (preset.offset.top + preset.image.h)
                                    }}
                                />
                            </div>

                            {/* Layer 3: Caption Overlay (Draggable) */}
                            {caption && textPos && (
                                <div
                                    ref={textRef}
                                    onPointerDown={handleTextPointerDown}
                                    onPointerMove={handleTextPointerMove}
                                    onPointerUp={handleTextPointerUp}
                                    onPointerCancel={handleTextPointerUp}
                                    style={{
                                        position: "absolute",
                                        top: textPos.y * scale,
                                        left: textPos.x * scale,
                                        transform: "translate(-50%, -50%)",
                                        fontFamily: font,
                                        fontSize: `${fontSize * scale}px`,
                                        color: "#111",
                                        cursor: "move",
                                        zIndex: 30, // Below canvas
                                        userSelect: "none",
                                        touchAction: "none",
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        maxWidth: `${(preset.full.w - 80) * scale}px`, // 40px padding * 2
                                        maxHeight: `${(preset.full.h - (preset.offset.top + preset.image.h) - 40) * scale}px`, // Chin height - 40px padding
                                        overflow: "hidden",
                                        textAlign: "center",
                                        lineHeight: "1",
                                        pointerEvents: drawingMode ? "none" : "auto"
                                    }}
                                >
                                    {caption}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Navigation - Hidden on Desktop */}
            <div className="md:hidden">
                <MobileNav
                    onUpload={handleFile}
                    drawingMode={drawingMode}
                    setDrawingMode={setDrawingMode}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    opacity={opacity}
                    setOpacity={setOpacity}
                    color={color}
                    setColor={setColor}
                    onUndo={() => stylusRef.current?.undo()}
                    onClear={() => stylusRef.current?.clear()}
                    onGenerate={handleGenerate}
                    caption={caption}
                    setCaption={setCaption}
                    format={format}
                    setFormat={(f) => setFormat(f)}
                />
            </div>

            {/* Download Modal */}
            {generatedUrl && (
                <DownloadModal
                    url={generatedUrl}
                    onClose={() => setGeneratedUrl(null)}
                />
            )}
        </div>
    );
}

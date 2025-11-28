"use client";
import React, { useState } from "react";
import { Upload, Crop, PenTool, Type, Settings, X } from "lucide-react";
import { Slider } from "./ui/Slider";
import { Switch } from "./ui/Switch";

interface MobileNavProps {
    onUpload: (file: File | null) => void;
    drawingMode: boolean;
    setDrawingMode: (v: boolean) => void;
    brushSize: number;
    setBrushSize: (v: number) => void;
    opacity: number;
    setOpacity: (v: number) => void;
    color: string;
    setColor: (v: string) => void;
    onUndo: () => void;
    onClear: () => void;
    onGenerate: () => void;
    caption: string;
    setCaption: (v: string) => void;
    format: "landscape" | "portrait";
    setFormat: (v: "landscape" | "portrait") => void;
}

const COLORS = [
    "#1A1A1A", "#E89F88", "#FFD1DC", "#C1E1C1", "#D4C1EC", "#A0C4FF", "#FFFFFF"
];

export function MobileNav({
    onUpload,
    drawingMode,
    setDrawingMode,
    brushSize,
    setBrushSize,
    opacity,
    setOpacity,
    color,
    setColor,
    onUndo,
    onClear,
    onGenerate,
    caption,
    setCaption,
    format,
    setFormat,
}: MobileNavProps) {
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const renderContent = () => {
        switch (activeTab) {
            case "upload":
                return (
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">Upload Photo</h3>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <span className="text-sm text-gray-500">Tap to upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => { onUpload(e.target.files?.[0] ?? null); setActiveTab(null); }} />
                        </label>
                    </div>
                );
            case "crop":
                return (
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">Format</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormat("landscape")}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${format === "landscape"
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                    }`}
                            >
                                Landscape
                            </button>
                            <button
                                onClick={() => setFormat("portrait")}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${format === "portrait"
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                    }`}
                            >
                                Portrait
                            </button>
                        </div>
                    </div>
                );
            case "text":
                return (
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">Caption</h3>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write something..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                );
            case "draw":
                return (
                    <div className="p-4 space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold dark:text-white">Drawing Tools</h3>
                            <button onClick={() => setActiveTab(null)}><X size={20} className="dark:text-white" /></button>
                        </div>
                        <Switch checked={drawingMode} onChange={setDrawingMode} label="Stylus Toggle" />
                        <Slider label="Brush Size" value={brushSize} min={1} max={20} onChange={setBrushSize} />
                        <Slider label="Opacity" value={opacity} min={10} max={100} onChange={setOpacity} />
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border border-gray-200 flex-shrink-0 ${color === c ? "ring-2 ring-primary" : ""}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onUndo} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg dark:text-white">Undo</button>
                            <button onClick={onClear} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg dark:text-white">Clear</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {activeTab && (
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setActiveTab(null)} />
            )}
            <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300 ${activeTab ? "translate-y-0" : "translate-y-0"}`}>
                {activeTab && (
                    <div className="max-h-[60vh] overflow-y-auto border-b dark:border-gray-700">
                        {renderContent()}
                    </div>
                )}

                <div className="flex justify-around items-center p-2 pb-6">
                    <button onClick={() => setActiveTab("upload")} className="flex flex-col items-center gap-1 p-2 text-gray-600 dark:text-gray-400">
                        <Upload size={24} />
                        <span className="text-[10px]">Upload</span>
                    </button>
                    <button onClick={() => setActiveTab("crop")} className={`flex flex-col items-center gap-1 p-2 ${activeTab === "crop" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`}>
                        <Crop size={24} />
                        <span className="text-[10px]">Format</span>
                    </button>
                    <button onClick={() => setActiveTab("draw")} className={`flex flex-col items-center gap-1 p-2 ${activeTab === "draw" || drawingMode ? "text-primary" : "text-gray-600 dark:text-gray-400"}`}>
                        <PenTool size={24} />
                        <span className="text-[10px]">Draw</span>
                    </button>
                    <button onClick={() => setActiveTab("text")} className={`flex flex-col items-center gap-1 p-2 ${activeTab === "text" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`}>
                        <Type size={24} />
                        <span className="text-[10px]">Text</span>
                    </button>
                    <button onClick={onGenerate} className="flex flex-col items-center gap-1 p-2 text-primary font-bold">
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-xs">Generate</span>
                    </button>
                </div>
            </div>
        </>
    );
}

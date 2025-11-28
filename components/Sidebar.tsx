"use client";
import React, { useState } from "react";
import { Upload, ChevronDown, ChevronUp, RotateCcw, RotateCw, Check } from "lucide-react";
import { Slider } from "./ui/Slider";
import { Switch } from "./ui/Switch";

interface SidebarProps {
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
    font: string;
    setFont: (v: string) => void;
    fontSize: number;
    setFontSize: (v: number) => void;
    format: "landscape" | "portrait";
    setFormat: (v: "landscape" | "portrait") => void;
}

const COLORS = [
    "#1A1A1A", // Black
    "#E89F88", // Peach
    "#FFD1DC", // Pink
    "#C1E1C1", // Green
    "#D4C1EC", // Purple
    "#A0C4FF", // Blue
    "#FFFFFF", // White
];

export function Sidebar({
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
    font,
    setFont,
    fontSize,
    setFontSize,
    format,
    setFormat,
}: SidebarProps) {
    const [sections, setSections] = useState({
        upload: true,
        drawing: true,
        text: true,
        format: true,
    });

    const toggleSection = (key: keyof typeof sections) => {
        setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <aside className="w-80 bg-white dark:bg-dark-surface border-r dark:border-gray-800 flex flex-col h-full transition-colors">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Upload Section */}
                <div className="border-b dark:border-gray-800 pb-4">
                    <button
                        onClick={() => toggleSection("upload")}
                        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                        <span>1. Upload</span>
                        {sections.upload ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {sections.upload && (
                        <div className="mt-2">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Click or drag to upload</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
                            </label>
                        </div>
                    )}
                </div>

                {/* Format Section */}
                <div className="border-b dark:border-gray-800 pb-4">
                    <button
                        onClick={() => toggleSection("format")}
                        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                        <span>2. Format</span>
                        {sections.format ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {sections.format && (
                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={() => setFormat("landscape")}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${format === "landscape"
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                Landscape
                            </button>
                            <button
                                onClick={() => setFormat("portrait")}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${format === "portrait"
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                Portrait
                            </button>
                        </div>
                    )}
                </div>

                {/* Text Section */}
                <div className="border-b dark:border-gray-800 pb-4">
                    <button
                        onClick={() => toggleSection("text")}
                        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                        <span>3. Caption</span>
                        {sections.text ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {sections.text && (
                        <div className="mt-2 space-y-4">
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Write something..."
                                maxLength={50}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                            <div className="flex justify-end text-xs text-gray-400">
                                {caption.length}/50
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">Font Style</label>
                                <select
                                    value={font}
                                    onChange={(e) => setFont(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                                >
                                    <option value="AmaticSC">Amatic SC</option>
                                    <option value="IndieFlower">Indie Flower</option>
                                    <option value="Caveat">Caveat</option>
                                    <option value="ShadowsIntoLight">Shadows Into Light</option>
                                </select>
                            </div>

                            <Slider
                                label="Font Size"
                                value={fontSize}
                                min={10}
                                max={100}
                                onChange={setFontSize}
                            />
                        </div>
                    )}
                </div>

                {/* Drawing Section */}
                <div className="border-b dark:border-gray-800 pb-4">
                    <button
                        onClick={() => toggleSection("drawing")}
                        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                        <span>4. Drawing / Handwriting</span>
                        {sections.drawing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {sections.drawing && (
                        <div className="space-y-6 mt-2">
                            <Switch checked={drawingMode} onChange={setDrawingMode} label="Stylus Toggle" />

                            <Slider
                                label="Brush Size"
                                value={brushSize}
                                min={1}
                                max={20}
                                onChange={setBrushSize}
                            />

                            <Slider
                                label="Opacity"
                                value={opacity}
                                min={10}
                                max={100}
                                onChange={setOpacity}
                            />

                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">Pastel Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-transform hover:scale-110 ${color === c ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-dark-surface" : ""
                                                }`}
                                            style={{ backgroundColor: c }}
                                        >
                                            {color === c && <Check size={14} className={c === "#FFFFFF" ? "text-black" : "text-white"} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={onUndo}
                                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={onClear}
                                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                                >
                                    <RotateCw size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t dark:border-gray-800">
                <button
                    onClick={onGenerate}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                    Generate Print-Ready File
                </button>
            </div>
        </aside>
    );
}

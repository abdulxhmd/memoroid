import create from "zustand";
import React from "react";

type State = {
    file?: File | null;
    originalImageSize?: { w: number; h: number } | null;
    cropData?: { x: number; y: number; width: number; height: number } | null;
    format: "landscape" | "portrait";
    caption: string;
    font: string;
    drawingMode: boolean;
    setFile: (f?: File | null) => void;
    setOriginalImageSize: (s?: { w: number; h: number } | null) => void;
    setCropData: (c?: { x: number; y: number; width: number; height: number } | null) => void;
    setFormat: (f: "landscape" | "portrait") => void;
    setCaption: (s: string) => void;
    setFont: (s: string) => void;
    setDrawingMode: (b: boolean) => void;
};

export const useEditorStore = create<State>((set) => ({
    file: undefined,
    originalImageSize: null,
    cropData: null,
    format: "landscape",
    caption: "",
    font: "AmaticSC",
    drawingMode: false,
    setFile: (f) => set({ file: f }),
    setOriginalImageSize: (s) => set({ originalImageSize: s }),
    setCropData: (c) => set({ cropData: c }),
    setFormat: (f) => set({ format: f }),
    setCaption: (s) => set({ caption: s }),
    setFont: (s) => set({ font: s }),
    setDrawingMode: (b) => set({ drawingMode: b })
}));

export default function EditorStateProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

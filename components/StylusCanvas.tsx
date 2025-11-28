"use client";
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { mapClientToInternal } from "../lib/utils";

type Point = { x: number; y: number; p: number };
type Stroke = Point[];

export type StylusCanvasHandle = {
    getOverlayBlob: () => Promise<Blob | null>;
    clear: () => void;
    undo: () => void;
};

type Props = {
    width: number;
    height: number;
    displayWidth?: number;
    displayHeight?: number;
    bgPreview?: string | null;
    preferStylusOnly?: boolean;
    drawingMode: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    opacity?: number;
    drawingArea?: { y: number; height: number };
};

const StylusCanvas = forwardRef<StylusCanvasHandle, Props>(({
    width, height, displayWidth, displayHeight, bgPreview, preferStylusOnly = false, drawingMode,
    strokeColor = "#111111", strokeWidth = 8, opacity = 1.0, drawingArea
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const drawingRef = useRef(false);
    const lastPoint = useRef<Point | null>(null);
    const curStroke = useRef<Stroke>([]);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [pressureValue, setPressureValue] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current!;
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${displayWidth ?? Math.round(width / window.devicePixelRatio)}px`;
        canvas.style.height = `${displayHeight ?? Math.round(height / window.devicePixelRatio)}px`;
        canvas.style.touchAction = drawingMode ? "none" : "auto";

        const ctx = canvas.getContext("2d")!;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctxRef.current = ctx;
    }, [width, height, displayWidth, displayHeight, drawingMode]);

    function getCanvasRect() {
        const c = canvasRef.current!;
        return c.getBoundingClientRect();
    }

    function isInsideDrawingArea(y: number) {
        if (!drawingArea) return true;
        return y >= drawingArea.y && y <= drawingArea.y + drawingArea.height;
    }

    function beginStroke(pt: Point) {
        curStroke.current = [pt];
        lastPoint.current = pt;
    }

    function appendPoint(pt: Point) {
        const ctx = ctxRef.current!;
        const p0 = lastPoint.current;
        if (!p0) {
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineWidth = Math.max(1, strokeWidth * pt.p);
            ctx.strokeStyle = strokeColor;
            ctx.globalAlpha = opacity;
            ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
            ctx.stroke();
        } else {
            const midX = (p0.x + pt.x) / 2;
            const midY = (p0.y + pt.y) / 2;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
            ctx.lineWidth = Math.max(1, strokeWidth * ((p0.p + pt.p) / 2));
            ctx.strokeStyle = strokeColor;
            ctx.globalAlpha = opacity;
            ctx.stroke();
        }
        curStroke.current.push(pt);
        lastPoint.current = pt;
    }

    function endStroke() {
        if (curStroke.current.length > 0) {
            const strokeData = {
                points: curStroke.current.slice(),
                color: strokeColor,
                width: strokeWidth,
                opacity: opacity
            };
            setStrokes((s) => {
                const next = [...s, strokeData as any];
                return next.slice(-50);
            });
        }
        curStroke.current = [];
        lastPoint.current = null;
    }

    function handlePointerDown(e: React.PointerEvent) {
        if (preferStylusOnly && e.pointerType === "touch") return;
        if (!drawingMode && e.pointerType !== "mouse") return;
        const rect = getCanvasRect();
        const pt = mapClientToInternal(e.clientX, e.clientY, rect, width, height);

        if (!isInsideDrawingArea(pt.y)) return;

        const pressure = e.pressure ?? (e.pointerType === "mouse" ? 0.6 : 0.5);
        const p = Math.max(0.01, Math.min(1, pressure));
        drawingRef.current = true;
        setPressureValue(p);
        (e.target as Element).setPointerCapture(e.pointerId);
        beginStroke({ x: pt.x, y: pt.y, p });
    }

    function handlePointerMove(e: React.PointerEvent) {
        if (!drawingRef.current) return;
        const rect = getCanvasRect();
        const pt = mapClientToInternal(e.clientX, e.clientY, rect, width, height);

        // If we move out of bounds, end the stroke? Or just clamp? 
        // For now, let's just stop adding points if outside, effectively clipping.
        if (!isInsideDrawingArea(pt.y)) {
            // Optional: could end stroke here to be strict
            return;
        }

        const pressure = e.pressure ?? (e.pointerType === "mouse" ? 0.6 : 0.5);
        const p = Math.max(0.01, Math.min(1, pressure));
        setPressureValue(p);
        appendPoint({ x: pt.x, y: pt.y, p });
    }

    function handlePointerUp(e: React.PointerEvent) {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        endStroke();
        try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { }
    }

    useImperativeHandle(ref, () => ({
        async getOverlayBlob() {
            const canvas = canvasRef.current!;
            return await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), "image/png");
            });
        },
        clear() {
            const ctx = ctxRef.current!;
            ctx.clearRect(0, 0, width, height);
            setStrokes([]);
        },
        undo() {
            setStrokes((prev) => {
                const next = prev.slice(0, -1);
                const ctx = ctxRef.current!;
                ctx.clearRect(0, 0, width, height);
                for (const strokeData of next) {
                    const stroke = (strokeData as any).points;
                    const sColor = (strokeData as any).color;
                    const sWidth = (strokeData as any).width;
                    const sOpacity = (strokeData as any).opacity;

                    for (let i = 0; i < stroke.length; i++) {
                        const p = stroke[i];
                        if (i === 0) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineWidth = Math.max(1, sWidth * p.p);
                            ctx.strokeStyle = sColor;
                            ctx.globalAlpha = sOpacity;
                            ctx.lineTo(p.x + 0.1, p.y + 0.1);
                            ctx.stroke();
                        } else {
                            const p0 = stroke[i - 1];
                            const midX = (p0.x + p.x) / 2;
                            const midY = (p0.y + p.y) / 2;
                            ctx.beginPath();
                            ctx.moveTo(p0.x, p0.y);
                            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
                            ctx.lineWidth = Math.max(1, sWidth * ((p0.p + p.p) / 2));
                            ctx.strokeStyle = sColor;
                            ctx.globalAlpha = sOpacity;
                            ctx.stroke();
                        }
                    }
                }
                return next;
            });
        }
    }), [width, height]);

    return (
        <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                display: "block",
                touchAction: drawingMode ? "none" : "auto",
                width: "100%",
                height: "100%"
            }}
        />
    );
});

export default StylusCanvas;

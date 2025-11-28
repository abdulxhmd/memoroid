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
};

const StylusCanvas = forwardRef<StylusCanvasHandle, Props>(({
    width, height, displayWidth, displayHeight, bgPreview, preferStylusOnly = false, drawingMode
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const drawingRef = useRef(false);
    const lastPoint = useRef<Point | null>(null);
    const curStroke = useRef<Stroke>([]);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [brushSize, setBrushSize] = useState(8);
    const [brushColor, setBrushColor] = useState("#111111");
    const [opacity, setOpacity] = useState(1.0);
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

        ctx.clearRect(0, 0, width, height);
    }, [width, height, displayWidth, displayHeight, drawingMode]);

    function getCanvasRect() {
        const c = canvasRef.current!;
        return c.getBoundingClientRect();
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
            ctx.lineWidth = Math.max(1, brushSize * pt.p);
            ctx.strokeStyle = brushColor;
            ctx.globalAlpha = opacity;
            ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
            ctx.stroke();
        } else {
            const midX = (p0.x + pt.x) / 2;
            const midY = (p0.y + pt.y) / 2;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
            ctx.lineWidth = Math.max(1, brushSize * ((p0.p + pt.p) / 2));
            ctx.strokeStyle = brushColor;
            ctx.globalAlpha = opacity;
            ctx.stroke();
        }
        curStroke.current.push(pt);
        lastPoint.current = pt;
    }

    function endStroke() {
        if (curStroke.current.length > 0) {
            setStrokes((s) => {
                const next = [...s, curStroke.current.slice()];
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
                for (const stroke of next) {
                    for (let i = 0; i < stroke.length; i++) {
                        const p = stroke[i];
                        if (i === 0) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineWidth = Math.max(1, brushSize * p.p);
                            ctx.strokeStyle = brushColor;
                            ctx.globalAlpha = opacity;
                            ctx.lineTo(p.x + 0.1, p.y + 0.1);
                            ctx.stroke();
                        } else {
                            const p0 = stroke[i - 1];
                            const midX = (p0.x + p.x) / 2;
                            const midY = (p0.y + p.y) / 2;
                            ctx.beginPath();
                            ctx.moveTo(p0.x, p0.y);
                            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
                            ctx.lineWidth = Math.max(1, brushSize * ((p0.p + p.p) / 2));
                            ctx.strokeStyle = brushColor;
                            ctx.globalAlpha = opacity;
                            ctx.stroke();
                        }
                    }
                }
                return next;
            });
        }
    }), [brushColor, brushSize, opacity, width, height]);

    return (
        <div>
            <div className="flex gap-2 mb-2 items-center">
                <label>Brush</label>
                <input type="range" min={1} max={100} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
                <label>Opacity</label>
                <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
                <button onClick={() => {
                    const ctx = ctxRef.current!;
                    ctx.clearRect(0, 0, width, height);
                    setStrokes([]);
                }}>Clear</button>
                <button onClick={() => {
                    (ref as any).current?.undo?.();
                }}>Undo</button>
                <div className="ml-auto text-sm">Pressure: {pressureValue.toFixed(2)}</div>
            </div>

            <div style={{ border: "1px solid #ddd", display: "inline-block" }}>
                <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{ display: "block", touchAction: drawingMode ? "none" : "auto" }}
                />
            </div>
        </div>
    );
});

export default StylusCanvas;

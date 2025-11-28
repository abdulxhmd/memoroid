import React, { useCallback, useRef, useState, useEffect } from "react";
import Cropper from "react-easy-crop";

type Props = {
    imageSrc: string;
    aspect: number;
    onCropComplete: (cropPreviewCoords: { x: number; y: number; width: number; height: number }) => void;
    onLoadOriginalSize?: (size: { w: number; h: number }) => void;
};

export default function ImageCropper({ imageSrc, aspect, onCropComplete, onLoadOriginalSize }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.onload = () => {
            onLoadOriginalSize?.({ w: img.naturalWidth, h: img.naturalHeight });
            imgRef.current = img;
        };
        img.src = imageSrc;
    }, [imageSrc, onLoadOriginalSize]);

    const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixelsRes) => {
        setCroppedAreaPixels(croppedAreaPixelsRes);
        onCropComplete({
            x: Math.round(croppedAreaPixelsRes.x),
            y: Math.round(croppedAreaPixelsRes.y),
            width: Math.round(croppedAreaPixelsRes.width),
            height: Math.round(croppedAreaPixelsRes.height)
        });
    }, [onCropComplete]);

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", height: 480, background: "#eee" }}>
            <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteInternal}
                objectFit="horizontal-cover"
            />
            <div style={{ position: "absolute", right: 12, bottom: 12 }}>
                <label className="text-sm">Zoom</label>
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                />
            </div>
        </div>
    );
}

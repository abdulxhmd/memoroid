export function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

export function mapClientToInternal(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    internalWidth: number,
    internalHeight: number
) {
    const scaleX = internalWidth / rect.width;
    const scaleY = internalHeight / rect.height;

    const x = Math.round((clientX - rect.left) * scaleX);
    const y = Math.round((clientY - rect.top) * scaleY);

    return {
        x: clamp(x, 0, internalWidth - 1),
        y: clamp(y, 0, internalHeight - 1)
    };
}

export function mapPreviewCropToOriginal(
    cropOnPreview: { x: number; y: number; width: number; height: number },
    previewSize: { w: number; h: number },
    originalSize: { w: number; h: number }
) {
    const scaleX = originalSize.w / previewSize.w;
    const scaleY = originalSize.h / previewSize.h;

    return {
        x: Math.round(cropOnPreview.x * scaleX),
        y: Math.round(cropOnPreview.y * scaleY),
        width: Math.round(cropOnPreview.width * scaleX),
        height: Math.round(cropOnPreview.height * scaleY)
    };
}

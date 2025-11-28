"use client";
import React, { useEffect, useState } from "react";

export default function DownloadPage() {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const u = sessionStorage.getItem("memoroid_result");
        setUrl(u);
    }, []);

    if (!url) {
        return (
            <div className="bg-white p-6 rounded-lg">
                <p>No generated result found. Go back to the editor and create one.</p>
                <a href="/" className="text-blue-600">Back to editor</a>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Your print-ready image</h2>
            <div className="mb-4">
                <img src={url} alt="generated" />
            </div>
            <div className="flex gap-2">
                <a href={url} download="memoroid_print.png" className="px-3 py-2 bg-primary text-white rounded">Download PNG</a>
                <a href="/" className="px-3 py-2 border rounded">Back to Editor</a>
            </div>
        </div>
    );
}

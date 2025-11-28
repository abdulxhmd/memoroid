import React from "react";
import { X, Download, RotateCcw } from "lucide-react";

interface DownloadModalProps {
    url: string;
    onClose: () => void;
}

export function DownloadModal({ url, onClose }: DownloadModalProps) {
    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `memoroid_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Your Print is Ready!</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900 flex justify-center">
                    <img src={url} alt="Generated Print" className="max-h-[60vh] rounded-lg shadow-lg object-contain" />
                </div>

                <div className="p-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                    >
                        <Download size={20} />
                        Download PNG
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <RotateCcw size={20} />
                        Create Another
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 pb-4">
                    If download doesn't start, check your pop-up blocker.
                </p>
            </div>
        </div>
    );
}

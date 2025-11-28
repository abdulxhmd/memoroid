import "../styles/globals.css";
import React from "react";

export const metadata = {
    title: "Memoroid",
    description: "Memoroid — create printed Polaroid and Instax keepsakes"
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-soft text-primary">
                {children}
            </body>
        </html>
    );
}

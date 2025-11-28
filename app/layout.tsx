import "../styles/globals.css";
import React from "react";

export const metadata = {
    title: "Memoroid",
    description: "Memoroid — create printed Polaroid and Instax keepsakes"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-soft text-primary">
                <div className="max-w-6xl mx-auto p-6">{children}</div>
            </body>
        </html>
    );
}

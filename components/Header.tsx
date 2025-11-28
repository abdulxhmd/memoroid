"use client";
import React from "react";
import { Moon, Sun, Settings } from "lucide-react";

interface HeaderProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

export function Header({ darkMode, toggleDarkMode }: HeaderProps) {
    return (
        <header className="relative flex items-center justify-between px-6 py-4 bg-white dark:bg-dark-surface shadow-sm transition-colors overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-polaroid-spectrum opacity-80" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">memoroid</h1>
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
}

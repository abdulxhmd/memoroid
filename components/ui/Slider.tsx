"use client";
import React from "react";

interface SliderProps {
    value: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
    label?: string;
    className?: string;
}

export function Slider({ value, min, max, onChange, label, className = "" }: SliderProps) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</label>
                    <span className="text-xs text-gray-400">{value}</span>
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
            />
        </div>
    );
}

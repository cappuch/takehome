"use client";

interface ScoreBarProps {
    label: string;
    value: number;
    average?: number;
}

export default function ScoreBar({ label, value, average }: ScoreBarProps) {
    const barColor =
        value >= 70
            ? "bg-emerald-500"
            : value >= 40
              ? "bg-amber-500"
              : "bg-red-400";

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-24 shrink-0">
                {label}
            </span>
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden relative">
                {average !== undefined && (
                    <div
                        className="absolute top-0 bottom-0 w-px bg-neutral-400"
                        style={{ left: `${average}%` }}
                    />
                )}
                <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${value}%` }}
                />
            </div>
            <span className="text-xs font-mono w-8 text-right text-neutral-600">
                {value}
            </span>
        </div>
    );
}

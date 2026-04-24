"use client";

import type { ScoringWeights } from "@/types";
import { WEIGHT_LABELS } from "@/types";

interface SettingsModalProps {
    weights: ScoringWeights;
    onWeightChange: (key: keyof ScoringWeights, value: number) => void;
    onNormalize: () => void;
    onReset: () => void;
    onCancel: () => void;
    onApply: () => void;
}

export default function SettingsModal({
    weights,
    onWeightChange,
    onNormalize,
    onReset,
    onCancel,
    onApply,
}: SettingsModalProps) {
    const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0);
    const isNormalized = Math.abs(weightTotal - 1) < 0.01;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                        Scoring Weights
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {(
                        Object.keys(WEIGHT_LABELS) as (keyof ScoringWeights)[]
                    ).map((key) => (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {WEIGHT_LABELS[key]}
                                </label>
                                <span className="text-sm font-mono text-neutral-500 dark:text-neutral-400">
                                    {weights[key].toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={Math.round(weights[key] * 100)}
                                onChange={(e) =>
                                    onWeightChange(
                                        key,
                                        Number(e.target.value) / 100,
                                    )
                                }
                                className="w-full accent-ember"
                            />
                        </div>
                    ))}
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400">
                                Total
                            </span>
                            <span
                                className={`font-mono font-medium ${
                                    isNormalized
                                        ? "text-emerald-600"
                                        : "text-amber-600"
                                }`}
                            >
                                {weightTotal.toFixed(2)}
                                {!isNormalized && " (will auto-normalize)"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 rounded-b-xl">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onReset}
                            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                        >
                            Reset defaults
                        </button>
                        {!isNormalized && (
                            <button
                                onClick={onNormalize}
                                className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
                            >
                                Normalize
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onApply}
                            className="px-4 py-2 text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors font-medium"
                        >
                            Apply & Re-rank
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

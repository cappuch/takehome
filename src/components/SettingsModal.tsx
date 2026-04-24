"use client";

import type { ScoringWeights } from "@/types";
import { WEIGHT_LABELS } from "@/types";

interface SettingsModalProps {
    weights: ScoringWeights;
    onWeightChange: (key: keyof ScoringWeights, value: number) => void;
    onReset: () => void;
    onCancel: () => void;
    onApply: () => void;
}

export default function SettingsModal({
    weights,
    onWeightChange,
    onReset,
    onCancel,
    onApply,
}: SettingsModalProps) {
    const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0);

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-800">
                        Scoring Weights
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-neutral-400 hover:text-neutral-700 text-xl leading-none"
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
                                <label className="text-sm font-medium text-neutral-700">
                                    {WEIGHT_LABELS[key]}
                                </label>
                                <span className="text-sm font-mono text-neutral-500">
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
                    <div className="pt-2 border-t border-neutral-200">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500">Total</span>
                            <span
                                className={`font-mono font-medium ${
                                    Math.abs(weightTotal - 1) < 0.01
                                        ? "text-emerald-600"
                                        : "text-amber-600"
                                }`}
                            >
                                {weightTotal.toFixed(2)}
                                {Math.abs(weightTotal - 1) < 0.01
                                    ? ""
                                    : " (should be 1.00)"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50 rounded-b-xl">
                    <button
                        onClick={onReset}
                        className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                    >
                        Reset defaults
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onApply}
                            className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
                        >
                            Apply & Re-rank
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

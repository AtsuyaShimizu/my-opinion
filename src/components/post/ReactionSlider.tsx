"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ReactionSliderProps {
  value: number | null;
  onChange?: (score: number) => void;
  onRemove?: () => void;
  disabled?: boolean;
  showAverage?: boolean;
  averageScore?: number | null;
}

export function ReactionSlider({
  value,
  onChange,
  onRemove,
  disabled = false,
  showAverage = false,
  averageScore,
}: ReactionSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const lastTapRef = useRef<number>(0);
  const valueBeforeDragRef = useRef<number | null>(null);

  const clampScore = (n: number) => Math.round(Math.max(0, Math.min(100, n)));

  const getScoreFromPosition = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return 50;
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return clampScore(ratio * 100);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      if (trackRef.current) {
        trackRef.current.setPointerCapture(e.pointerId);
      }

      const score = getScoreFromPosition(e.clientX);
      valueBeforeDragRef.current = value;
      setDragValue(score);
      setIsDragging(true);
      setShowPopup(true);
    },
    [disabled, getScoreFromPosition, value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const score = getScoreFromPosition(e.clientX);
      setDragValue(score);
    },
    [isDragging, getScoreFromPosition]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      if (trackRef.current?.hasPointerCapture(e.pointerId)) {
        trackRef.current.releasePointerCapture(e.pointerId);
      }
      const finalValue = dragValue ?? value;
      setIsDragging(false);
      setShowPopup(false);
      setDragValue(null);
      if (finalValue !== null) {
        onChange?.(finalValue);
      }
    },
    [isDragging, dragValue, value, onChange]
  );

  const handleDoubleClick = useCallback(() => {
    if (disabled || value === null) return;
    onRemove?.();
  }, [disabled, value, onRemove]);

  const handleThumbPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // Double-tap detection
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        e.stopPropagation();
        handleDoubleClick();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Normal drag start
      e.stopPropagation();
      e.preventDefault();
      if (trackRef.current) {
        trackRef.current.setPointerCapture(e.pointerId);
      }
      valueBeforeDragRef.current = value;
      setDragValue(value);
      setIsDragging(true);
      setShowPopup(true);
    },
    [disabled, value, handleDoubleClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      const current = isDragging ? (dragValue ?? 50) : (value ?? 50);

      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          {
            const next = clampScore(current + 5);
            setDragValue(next);
            onChange?.(next);
          }
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          {
            const next = clampScore(current - 5);
            setDragValue(next);
            onChange?.(next);
          }
          break;
        case "Escape":
          e.preventDefault();
          if (isDragging) {
            setDragValue(valueBeforeDragRef.current);
            setIsDragging(false);
            setShowPopup(false);
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (current !== null) {
            onChange?.(current);
          }
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (value !== null) {
            onRemove?.();
          }
          break;
      }
    },
    [disabled, dragValue, value, isDragging, onChange, onRemove]
  );

  const displayValue = isDragging ? dragValue : value;
  const hasReaction = displayValue !== null;

  // Build the gradient for the filled portion
  const gradientStyle = hasReaction
    ? {
        width: `${displayValue}%`,
        background:
          displayValue <= 50
            ? `linear-gradient(to right, #fb7185, #fcd34d)`
            : `linear-gradient(to right, #fb7185, #fcd34d ${Math.round((50 / displayValue) * 100)}%, #34d399)`,
      }
    : undefined;

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="リアクションスコア"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={displayValue ?? undefined}
      aria-valuetext={
        displayValue !== null ? `${displayValue}%の共感` : "未評価"
      }
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "relative h-6 w-full touch-none select-none",
        disabled ? "pointer-events-none opacity-50" : "cursor-pointer"
      )}
    >
      {/* Track background */}
      <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-muted transition-colors" />

      {/* Filled track with gradient */}
      {hasReaction && (
        <div
          className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full transition-[width] duration-75"
          style={gradientStyle}
        />
      )}

      {/* Average score marker */}
      {showAverage && averageScore != null && (
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-foreground/25"
          style={{ left: `${averageScore}%` }}
          title={`平均: ${averageScore}`}
        />
      )}

      {/* Thumb */}
      {hasReaction && (
        <div
          className={cn(
            "absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full",
            "border-2 border-primary bg-background shadow-md",
            "transition-[transform,box-shadow] duration-150 ease-out",
            isDragging
              ? "scale-[1.15] shadow-xl ring-2 ring-primary/30"
              : "hover:scale-105 hover:shadow-lg"
          )}
          style={{ left: `${displayValue}%` }}
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Score popup */}
          {showPopup && isDragging && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-bold text-background animate-fade-in-up">
              {displayValue}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Hint text for unreacted state */}
      {!hasReaction && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
          <span className="text-[10px] text-muted-foreground/60">
            スライドして評価
          </span>
        </div>
      )}
    </div>
  );
}

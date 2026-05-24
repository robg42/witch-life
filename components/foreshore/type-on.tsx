"use client";

import { useEffect, useRef, useState } from "react";

/*
  Character-by-character type effect for transmissions and console
  output. Behaviour:
    - Types the given text at `speedMs` per character (default 35).
    - Skips immediately to the end on tap/click anywhere on the node
      (operator can demand it now).
    - Cursor blinks at the tail while typing AND after completion
      (until `keepCursor={false}`).
    - Calls `onDone` once when finished. Stable across re-renders.

  We deliberately do not introduce randomness in per-character delay
  — the steady metronomic feel is part of the station's character.
*/

interface Props {
  text: string;
  /** Milliseconds per character. CIPHER ~22ms, FIELD ~38ms, LONG-WAVE ~58ms. */
  speedMs?: number;
  /** Pause this long before starting. */
  delayMs?: number;
  /** Show blinking cursor at the end. */
  keepCursor?: boolean;
  /** Allow user click to skip to finished state. */
  skippable?: boolean;
  /** Called once, when the type animation finishes. */
  onDone?: () => void;
  className?: string;
}

export function TypeOn({
  text,
  speedMs = 35,
  delayMs = 0,
  keepCursor = true,
  skippable = true,
  onDone,
  className = "",
}: Props) {
  const [i, setI] = useState(0);
  const [started, setStarted] = useState(delayMs === 0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setI(0);
    setStarted(delayMs === 0);
    doneRef.current = false;
    if (delayMs > 0) {
      const t = window.setTimeout(() => setStarted(true), delayMs);
      return () => window.clearTimeout(t);
    }
  }, [text, delayMs]);

  useEffect(() => {
    if (!started) return;
    if (i >= text.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }
    const t = window.setTimeout(() => setI((n) => n + 1), speedMs);
    return () => window.clearTimeout(t);
  }, [i, started, text, speedMs]);

  const done = i >= text.length;
  const visible = text.slice(0, i);
  const showCursor = !done || keepCursor;

  const skip = () => {
    if (!skippable || done) return;
    setI(text.length);
  };

  return (
    <span
      onClick={skip}
      className={
        (showCursor ? "fs-cursor " : "") +
        (skippable && !done ? "cursor-pointer " : "") +
        className
      }
    >
      {visible}
    </span>
  );
}

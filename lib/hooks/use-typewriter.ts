"use client";

import { useEffect, useMemo, useState } from "react";

export function useTypewriter(text: string, enabled: boolean) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!enabled || !text) {
      return;
    }

    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;
      setDisplayedText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, 12);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, text]);

  return useMemo(() => {
    if (!enabled) {
      return text;
    }

    return displayedText;
  }, [displayedText, enabled, text]);
}
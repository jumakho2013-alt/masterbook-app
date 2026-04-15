import React, { useEffect, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

interface CountUpProps {
  value: number;
  duration?: number;
  style?: TextStyle | TextStyle[];
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (n: number) => string;
}

export function CountUp({
  value,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter,
}: CountUpProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const end = value;
    if (start === end) return;

    const startTime = Date.now();
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(end);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const text = formatter
    ? formatter(display)
    : `${prefix}${display.toFixed(decimals)}${suffix}`;

  return <Text style={style}>{text}</Text>;
}

import React, { useMemo } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

interface MiniSparklineProps {
  /** Значения (по порядку слева-направо). Меньше 2 точек → ничего не рисуем. */
  data: number[];
  color: string;
  width?: number;
  height?: number;
  /** Заливка под линией (мягкий градиент). По умолчанию включена. */
  fill?: boolean;
  strokeWidth?: number;
}

/**
 * Мини-спарклайн в углу карточки метрики — как в health-app референсе
 * (Cardio load / Stress): крошечный плавный график-намёк на тренд.
 *
 * Чистый SVG (react-native-svg уже в проекте), без зависимостей. Сглаживание
 * Catmull-Rom → Bezier, мягкая градиентная заливка. Адаптивно к высоте/ширине.
 */
export function MiniSparkline({
  data,
  color,
  width = 64,
  height = 28,
  fill = true,
  strokeWidth = 2,
}: MiniSparklineProps) {
  const paths = useMemo(() => {
    if (!data || data.length < 2) return null;
    const pad = strokeWidth + 1;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const n = data.length;
    const stepX = (width - pad * 2) / (n - 1);
    const x = (i: number) => pad + i * stepX;
    const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / span);

    const pts = data.map((v, i) => ({ x: x(i), y: y(v) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    const area = `${d} L ${pts[n - 1].x} ${height} L ${pts[0].x} ${height} Z`;
    return { line: d, area };
  }, [data, width, height, strokeWidth]);

  if (!paths) return null;
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.30" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {fill && <Path d={paths.area} fill={`url(#${gradId})`} />}
      <Path
        d={paths.line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

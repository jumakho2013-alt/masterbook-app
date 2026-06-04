// Types-only module.
// Runtime implementations live in `LiquidGlass.ios.tsx` and
// `LiquidGlass.android.tsx` — Metro picks the correct one per platform.
// This declaration file exists so TypeScript can resolve `./LiquidGlass`
// from the UI barrel without platform-aware module resolution.
import type { LiquidGlassProps, LiquidGlassVariant } from './LiquidGlass.shared';

export declare function LiquidGlass(props: LiquidGlassProps): JSX.Element;
export type { LiquidGlassVariant };

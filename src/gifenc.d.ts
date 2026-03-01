declare module 'gifenc' {
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: string; oneBitAlpha?: boolean | number }
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: string
  ): Uint8Array;

  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: number[][]; delay?: number; first?: boolean }
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
  };

  const defaultExport: { quantize: typeof quantize; applyPalette: typeof applyPalette; GIFEncoder: typeof GIFEncoder };
  export default defaultExport;
}

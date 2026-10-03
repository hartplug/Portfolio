export type OrbState = 'listening' | 'reasoning' | 'searching' | 'done';
export declare const ORB_STATES: readonly OrbState[];
export interface AIStatusOrb {
  setState(nameOrIndex: OrbState | number, config?: { instant?: boolean }): void;
  getState(): OrbState;
  getColor(): [number, number, number];
  setVoiceLevel(level: number | null): void;
  setColors(colors: Partial<Record<OrbState, string | [number, number, number]>>): void;
  renderAt(seconds: number): void;
  play(): void;
  pause(): void;
  resize(): void;
  destroy(): void;
}
export declare function createAIStatusOrb(canvas: HTMLCanvasElement, options?: {
  particles?: number; colors?: Partial<Record<OrbState, string>>; scale?: number;
  pointSize?: number; glow?: number; speed?: number; transition?: number;
  maxDpr?: number; seed?: number; autoplay?: boolean; preserveDrawingBuffer?: boolean;
  onStateChange?: (state: OrbState) => void;
}): AIStatusOrb;

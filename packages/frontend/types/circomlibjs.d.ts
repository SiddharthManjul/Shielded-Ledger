declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<any>;
  export function buildBabyjub(): Promise<any>;
  export function buildMimc7(): Promise<any>;
  export function buildPedersenHash(): Promise<any>;
}

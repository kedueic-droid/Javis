/** Commands from HUD chrome (操控場景) into the WebGL solar-system camera. */

export type SolarCamCmd =
  | { type: "orbit"; dx: number; dy: number }
  | { type: "pan"; dx: number; dy: number }
  | { type: "dolly"; delta: number }
  | { type: "reset" };

type Listener = (cmd: SolarCamCmd) => void;

const listeners = new Set<Listener>();

export function subscribeSolarCam(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function dispatchSolarCam(cmd: SolarCamCmd): void {
  listeners.forEach((listener) => listener(cmd));
}

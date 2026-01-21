
export interface Vector2 {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Vector2;
  end: Vector2;
  height: number;
  thickness: number;
  type: 'wall' | 'window' | 'door';
}

export interface Furniture {
  id: string;
  type: string;
  position: Vector2;
  rotation: number;
  scale: [number, number, number];
}

export interface SceneData {
  walls: Wall[];
  furniture: Furniture[];
  floorColor: string;
  wallColor: string;
}

export interface SceneConfig {
  ambientIntensity: number;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
  cameraPosition: [number, number, number];
  showGrid: boolean;
}

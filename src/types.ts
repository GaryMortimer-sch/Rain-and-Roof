export interface Roof {
  id: string;
  name: string;
  area: number;
  shape: 'rectangle' | 'square' | 'circle';
}

export interface RainEntry {
  id: string;
  date: string;
  mm: number;
}

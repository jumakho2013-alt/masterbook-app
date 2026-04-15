export type ProfessionCategory =
  | 'beauty'
  | 'health'
  | 'repair'
  | 'education'
  | 'photo'
  | 'auto'
  | 'home'
  | 'pets'
  | 'events'
  | 'handmade'
  | 'other';

export interface Specialization {
  id: string;
  category: ProfessionCategory;
  name: string;
  icon: string; // lucide icon name
}

export interface FieldConfig {
  clientAddress: boolean;
  beforeAfterPhotos: boolean;
  materials: boolean;
  extraDescription: { enabled: boolean; label: string };
  timeStep: 15 | 30 | 60 | 'fullday';
  durationRange: { min: number; max: number }; // minutes
}

export interface ProfessionCategoryInfo {
  id: ProfessionCategory;
  name: string;
  icon: string;
  color: string;
  specializations: Specialization[];
  defaultFieldConfig: FieldConfig;
}

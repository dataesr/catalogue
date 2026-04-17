import type { ColorFamily } from '@/components/ui/ColorPicker';

export type ResourceFormat =
  | 'application'
  | 'tableau-de-bord'
  | 'api'
  | 'publication'
  | 'open-data'
  | 'referentiel';

export interface FormatMeta {
  id: ResourceFormat;
  label: string;
  icon: string;
  color: ColorFamily;
}

export interface Topic {
  id: string;
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: ColorFamily;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  format: ResourceFormat;
  topics: string[];
  url?: string;
  internalPath?: string;
  requiresAuth: boolean;
  keywords: string[];
}

export interface Catalog {
  topics: Topic[];
  formats: FormatMeta[];
  resources: Resource[];
}

export interface SearchEntry {
  id: string;
  title: string;
  description: string;
  type: 'resource' | 'publication' | 'dataset' | 'topic';
  format?: ResourceFormat;
  topics: string[];
  url?: string;
  internalPath?: string;
  requiresAuth: boolean;
  keywords: string[];
  icon?: string;
}

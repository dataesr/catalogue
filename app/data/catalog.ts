import data from '../../catalog.json';
import type { Catalog, FormatMeta, Resource, Topic } from '@/data/types';

export const catalog = data as unknown as Catalog & { highlightedResourceIds: string[] };
const { topics, formats, resources } = catalog;

export function getTopicBySlug(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

export function getTopicById(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

export function getResourcesForTopic(topicId: string): Resource[] {
  return resources.filter((r) => r.topics.includes(topicId));
}

export function getResourceCountForTopic(topicId: string): number {
  return resources.filter((r) => r.topics.includes(topicId)).length;
}

export function getFormatMeta(formatId: string): FormatMeta | undefined {
  return formats.find((f) => f.id === formatId);
}

export function getTopicsForResource(resource: Resource): Topic[] {
  return resource.topics.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[];
}

export function getAvailableFormatsForResources(resourceList: Resource[]): FormatMeta[] {
  const usedFormats = new Set(resourceList.map((r) => r.format));
  return formats.filter((f) => usedFormats.has(f.id));
}

export const highlightedResources = resources.filter((r) =>
  catalog.highlightedResourceIds.includes(r.id),
);

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/api/eden-treaty';
import type { CatalogItem, CatalogSearchParams, CatalogSearchResponse, GroupedSearchParams, GroupedSearchResponse } from '~/schemas/catalog';

export const catalogKeys = {
  search: (params: CatalogSearchParams) => ['catalog', 'search', params] as const,
  grouped: (params: GroupedSearchParams) => ['catalog', 'grouped', params] as const,
  detail: (id: string) => ['catalog', id] as const,
};

async function searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResponse> {
  const { data, error } = await api.search.get({ query: params });
  if (error) throw new Error('Erreur lors de la recherche dans le catalogue');
  return data;
}

async function getGroupedSearch(params: GroupedSearchParams): Promise<GroupedSearchResponse> {
  const { data, error } = await api.search.grouped.get({ query: params });
  if (error) throw new Error('Erreur lors de la recherche groupée');
  return data;
}

async function getCatalogItem(id: string): Promise<CatalogItem> {
  const { data, error } = await api.search({ id }).get();
  if (error) throw new Error('Élément du catalogue introuvable');
  return data;
}

export function useCatalogSearch(params: CatalogSearchParams) {
  return useQuery({
    queryKey: catalogKeys.search(params),
    queryFn: () => searchCatalog(params),
    placeholderData: keepPreviousData,
  });
}

export function useGroupedCatalogSearch(params: GroupedSearchParams) {
  return useQuery({
    queryKey: catalogKeys.grouped(params),
    queryFn: () => getGroupedSearch(params),
    placeholderData: keepPreviousData,
  });
}

export function useCatalogItem(id: string) {
  return useQuery({
    queryKey: catalogKeys.detail(id),
    queryFn: () => getCatalogItem(id),
  });
}

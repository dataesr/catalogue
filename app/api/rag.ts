import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { api } from "@/api/eden-treaty"
import type { RagSearchParams, RagSearchResponse, RagCompletionParams } from "~/schemas/rag"

async function ragSearch(params: RagSearchParams): Promise<RagSearchResponse> {
  const { data, error } = await api.rag.get({ query: params })
  if (error) throw new Error("Erreur lors de la recherche dans le rag")
  return data
}

async function ragCompletion(params: RagCompletionParams): Promise<string> {
  const { data, error } = await api.rag.mistral.post({ ...params })
  if (error) throw new Error("Erreur lors de la complétion avec Mistral")
  return data
}

export function useRagSearch(params: RagSearchParams) {
  return useQuery({
    queryKey: ["rag", "search", params],
    queryFn: () => ragSearch(params),
    enabled: params.q.length > 0,
    // placeholderData: keepPreviousData,
  })
}

export function useRagCompletion(params: RagCompletionParams) {
  return useQuery({
    queryKey: ["rag", "completion", params],
    queryFn: () => ragCompletion(params),
    enabled: false, // fetch manually
  })
}

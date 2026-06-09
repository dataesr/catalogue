import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { api } from "@/api/eden-treaty"
import type { RagResponse } from "~/schemas/rag"

async function queryFlashRag(q: string, top_k: number): Promise<RagResponse> {
  const { data, error } = await api.rag.get({ query: { q, top_k } })
  if (error) throw new Error("Erreur lors de la recherche dans le rag")
  return data
}

async function completeFlashRag(q: string, sources: Object | string): Promise<string> {
  const { data, error } = await api.rag.mistral.post({  q, sources  })
  if (error) throw new Error("Erreur lors de la complétion avec Mistral")
  return data
}

export function useFlashRag(q: string, top_k: number) {
  return useQuery({
    queryKey: ["flash-rag", q, top_k],
    queryFn: () => queryFlashRag(q, top_k),
    enabled: q.length > 0,
    // placeholderData: keepPreviousData,
  })
}

export function useFlashRagCompletion(q: string, sources: Object | string) {
  return useQuery({
    queryKey: ["flash-rag-completion", q, sources],
    queryFn: () => completeFlashRag(q, sources),
    enabled: false, // fetch manually
  })
}
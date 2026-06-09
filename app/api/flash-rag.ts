import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/eden-treaty"

async function queryFlashRag(q: string, top_k: number) {
  const { data, error } = await api.rag.get({ query: { q, top_k } })
  if (error) throw new Error("Erreur lors de la recherche dans le rag")
  return data
}

export function useFlashRag(q: string, top_k: number) {
  return useQuery({
    queryKey: ["flash-rag", q, top_k],
    queryFn: () => queryFlashRag(q, top_k),
    enabled: q.length > 0,
  })
}

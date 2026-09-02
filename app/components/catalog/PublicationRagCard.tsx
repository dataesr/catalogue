import cn from "classnames"
import ReactMarkdown from "react-markdown"
import { formatDate, formatFileSize, formatNumber } from "./utils"
import "./styles.css"
import { useState } from "react"
import { useCatalogItem } from "@/api/catalog"
import type { RagSource } from "~/schemas/rag"
import { useFlashRagCompletion } from "@/api/flash-rag"


export default function PublicationRagCard({
  data,
  query,
}: {
  data: { id: number; date: string; sources: RagSource[] }
  query: string
}) {
  const [extendSources, setExtendSources] = useState<number>(-1)
  const { data: item, isLoading, isFetching } = useCatalogItem(`zenodo-${data.id}`)
  // console.log("query", query)
  const { data: completion, isLoading: isCompleting, refetch } = useFlashRagCompletion(query, data.sources)
  // console.log("item", item)
  // console.log("completion", completion)

  if (isLoading || isFetching) return null
  if (!item) return <div>Erreur: publication introuvable (id: {data.id})</div>

  const pdfFile = item.files.find((f) => f.key.endsWith(".pdf"))

  return (
    <div className="catalog-card catalog-card--no-hover">
      {item.thumbnailUrl && <img className="catalog-card__thumbnail" src={item.thumbnailUrl} alt="" loading="lazy" />}
      <div className="catalog-card__body">
        <div className="fx-flex fx-flex-wrap fx-items-center fx-gap-2w fr-mb-1v">
          {item.journal && (
            <span
              className={cn("fr-badge fr-badge--sm fr-badge--no-icon", {
                "fr-badge--info": item.journal.includes("Note d'information"),
                "fr-badge--new": item.journal.includes("Note flash"),
              })}
            >
              {item.journal}
              {item.issue ? ` n°${item.issue}` : ""}
            </span>
          )}
          {item.publicationType && !item.journal && (
            <span className="fr-badge fr-badge--sm fr-badge--no-icon">{item.publicationType}</span>
          )}
          {item.published && <span className="fr-text--xs fr-text-mention--grey fr-mb-0">{formatDate(item.published)}</span>}
        </div>
        <a
          className="catalog-card__title catalog-card__title--no-decoration"
          href={`/publications/${item.id}`}
          target="_blank"
        >
          {item.title}
        </a>

        {item.authors.length > 0 && (
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fx-clamp-1">
            {item.authors.map((a) => a.name).join(", ")}
          </p>
        )}

        {/* {item.description && <p className="catalog-card__desc">{item.description}</p>} */}

        {/* {data &&
          data.chunks &&
          data.chunks.map((chunk: any, index: number) => (
            <p key={index} className="catalog-card__rag-chunk">
              {chunk.document}
            </p>
          ))} */}

        {data &&
          data.sources &&
          data.sources.map((source, index) => (
            <div
              key={index}
              onClick={() => setExtendSources(extendSources === index ? -1 : index)}
              className="catalog-card__highlight_box"
            >
              <div className="catalog-card__meta">
                {source.metadata.page_index !== undefined && (
                  <span className="catalog-card__meta-item">Page {source.metadata.page_index + 1}</span>
                )}
                {source.metadata.page_index !== undefined && <span className="catalog-card__meta-item">-</span>}
                <span className="catalog-card__meta-item">Score: {(1 - source.distance).toFixed(2)}</span>
              </div>
              {source.metadata.section_title && (
                <div className="catalog-card__meta">
                  <span className="catalog-card__meta-item">{source.metadata.section_title}</span>
                </div>
              )}
              <p className={cn("catalog-card__highlight", { "catalog-card__highlight--expanded": extendSources === index })}>
                {source.document}
              </p>
            </div>
          ))}

        <div className="catalog-card__meta">
          {item.downloads > 0 && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-download-line fr-icon--sm" aria-hidden="true" />
              {formatNumber(item.downloads)}
            </span>
          )}
          {item.views > 0 && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-eye-line fr-icon--sm" aria-hidden="true" />
              {formatNumber(item.views)}
            </span>
          )}
          {pdfFile && (
            <span className="catalog-card__meta-item">
              <span className="fr-icon-file-pdf-line fr-icon--sm" aria-hidden="true" />
              PDF ({formatFileSize(pdfFile.size)})
            </span>
          )}
        </div>
        <button className="fr-btn fr-btn--sm fr-btn--secondary" onClick={() => refetch()} disabled={isCompleting}>
          <span className="fr-icon-sparkling-2-line fr-icon--sm fr-mr-2v" aria-hidden="true" />
          Générer une réponse à partir de ce document
        </button>
        {completion && (
          <div className="catalog-card__meta">
            <div className="catalog-card__meta-item">Réponse générée :</div>
            <div>
              <ReactMarkdown>{completion}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
      <span className="catalog-card__arrow fr-icon-arrow-right-line" aria-hidden="true" />
    </div>
  )
}

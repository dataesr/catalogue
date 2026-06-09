import cn from "classnames"
import { formatDate, formatFileSize, formatNumber } from "./utils"
import "./styles.css"
import { useState } from "react"
import { useCatalogItem } from "@/api/catalog"
import type { RagSource } from "~/schemas/rag"

export default function PublicationRagCard({ data }: { data: { id: number; date: string; sources: RagSource[] } }) {
  const [extendSources, setExtendSources] = useState<number>(-1)
  const { data: item, isLoading, isFetching } = useCatalogItem(`zenodo-${data.id}`)
  console.log("item", item)

  if (isLoading || isFetching) return null
  if (!item) return <div>Erreur: publication introuvable (id: {data.id})</div>

  const pdfFile = item.files.find((f) => f.key.endsWith(".pdf"))

  return (
    // <Link to={`/publications/${item.id}`} className="catalog-card">
    <div className="catalog-card catalog-card--no-hover">
      {item.thumbnailUrl && <img className="catalog-card__thumbnail" src={item.thumbnailUrl} alt="" loading="lazy" />}
      <div className="catalog-card__body">
        <p className="catalog-card__title">{item.title}</p>
        <div className="fx-flex fx-flex-wrap fx-items-center fx-gap-1w fr-mb-1v">
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
          {item.published && <span className="fr-text--xs fr-text-mention--grey">{formatDate(item.published)}</span>}
        </div>

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
              className="catalog-card__rag-source"
            >
              <div className="catalog-card__meta">
                {source.metadata.page_index !== undefined && (
                  <span className="catalog-card__meta-item">Page {source.metadata.page_index + 1}</span>
                )}
                {source.metadata.page_index !== undefined && source.metadata.section_title && (
                  <span className="catalog-card__meta-item">-</span>
                )}
                {source.metadata.section_title && (
                  <span className="catalog-card__meta-item">{source.metadata.section_title}</span>
                )}
                {source.metadata.section_title && <span className="catalog-card__meta-item">-</span>}
                <span className="catalog-card__meta-item">Score: {(1 - source.distance).toFixed(2)}</span>
              </div>
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
      </div>
      <span className="catalog-card__arrow fr-icon-arrow-right-line" aria-hidden="true" />
    </div>
    // </Link>
  )
}

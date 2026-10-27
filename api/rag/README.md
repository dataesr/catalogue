# Catalogue RAG pipeline

This directory implements the Retrieval-Augmented Generation (RAG) pipeline for Catalogue publications. It ingests publication PDFs and the bundled EESR 2019 page archive into Elasticsearch, then retrieves relevant chunks through the Catalogue API.

## Pipeline overview

`sync-rag` performs the following steps:

1. Creates a fresh RAG index named from the configured RAG alias and the current date. If an index with that date already exists, it appends a numeric suffix.
2. Fetches eligible Zenodo publications from the catalog index and keeps PDF files.
3. Gets OCR for each PDF from the local OCR cache, or calls Mistral OCR if there is no cached result (or `forceOcr` is enabled).
4. Converts OCR pages into paragraph and table chunks, generates embeddings in batches, and indexes them.
5. Loads EESR pages from `PAGE_EESR19.zip`, checks Zenodo for the latest EESR record ID, transforms the page text and tables into chunks, and indexes them into the same RAG index.
6. Refreshes and verifies the index document count against the number of chunks reported by both ingestion stages.
7. Promotes the completed index to the configured RAG alias.

The RAG index is built separately from the catalog index. The `catalog_item_id` on publication chunks links search results back to their catalog records.

## Running ingestion

The `sync-rag` flow is registered with Declic and can be triggered on its own. It accepts these optional inputs:

| Input | Description |
| --- | --- |
| `catalogIndex` | Catalog Elasticsearch index to read publications from. Defaults to the configured catalog index. |
| `targetIndex` | Existing RAG index to populate. If omitted, a new dated index is created. |
| `forceOcr` | Re-run Mistral OCR instead of reading cached OCR results. Defaults to `false`. |

`full-sync` also runs `sync-rag` after it has populated the new catalog index, passing that index as `catalogIndex`. This ensures RAG ingestion reads the catalog data created by the same full-sync run.

A successful flow returns the RAG index name and ingestion counts. Once promoted, queries use the configured RAG alias.

## Catalog publication ingestion

The catalog ingestion stage currently selects Zenodo records whose type is `publication` and whose publication type is `article`, plus the specific book IDs listed in `EXTRA_BOOK_IDS` in [ingest-catalog.ts](./ingest-catalog.ts). It processes each PDF file listed on those records.

For every PDF:

- OCR results are cached as JSON at `<RAG_OCR_CACHE_DIR>/<record_id>/<file_name>.json`.
- A cache hit skips the Mistral OCR request. Re-chunking still happens on every run; only OCR output is cached.
- The OCR markdown is split into chunks of at most 3,000 characters. Chunks shorter than 50 characters are discarded.
- Mistral embeddings are generated in batches of eight chunks and stored with each chunk in Elasticsearch.

The default OCR cache directory is `pvc/rag/ocr`. Configure `RAG_OCR_CACHE_DIR` to point it to a persistent volume in deployments where the cache should survive pod restarts.

## EESR ingestion

The EESR stage reads the structured JSON pages from `PAGE_EESR19.zip` in the application root. The archive is copied into the runtime image by the root [Dockerfile](../../Dockerfile). It does not OCR the EESR PDF.

Each run fetches the latest record ID from the Zenodo versions API for concept ID `19450708`. The page data remains the bundled 2019 archive; only the associated latest Zenodo record ID is resolved at ingestion time.

The transformer skips pages with a current-page ID of 1 or less and the explicit non-content/annex page list in [ingest-eesr.ts](./ingest-eesr.ts). It produces paragraph and Markdown table chunks, then uses the same embedding and indexing function as catalog publications.

For local runs, ensure the archive is present at `PAGE_EESR19.zip` in the working directory. The archive location can be overridden when calling `ingestEESR` programmatically.

## Configuration and dependencies

The pipeline uses:

- `ELASTIC_NODE` and the configured Elasticsearch credentials to access Elasticsearch.
- `ES_PLATEFORM_CATALOG_INDEX` to select the source catalog index (default: `catalog`).
- `ES_PLATEFORM_CATALOG_RAG_INDEX` to set the RAG alias (default: `catalog-rag`).
- `MISTRAL_API_KEY` for OCR and embeddings.
- `RAG_OCR_CACHE_DIR` for cached OCR JSON files (default: `pvc/rag/ocr`).
- `ML_HUB_API_URL` and `ML_HUB_API_KEY` optionally for cross-encoder reranking. These must be configured together. If they are absent or the cross-encoder request fails, retrieval uses the lightweight local reranker.

The RAG mapping uses 1,024-dimensional dense vectors and French text analysis. Mistral SDK retries are configured with exponential backoff for transient errors.

## Retrieval

The HTTP API exposes:

- `GET /rag`: embeds the query, performs dense vector and sparse text search, optionally fuses results with reciprocal rank fusion, and optionally reranks them. Defaults enable both hybrid fusion and reranking.
- `POST /rag/mistral`: generates a French answer from the supplied chunks.

Search accepts `q`, `topK`, `topic`, `publicationType`, `accessRight`, `author`, `useHybrid`, and `useRerank`. Results include chunk metadata and scores; the `/rag` route also looks up matching catalog items where available.

Retrieval filters out chunks shorter than 50 characters and publications older than the four-year cutoff used by `buildRagFilters` in [retrieval.ts](./retrieval.ts). Hybrid search combines dense and sparse rankings; reranking uses the configured ML Hub cross-encoder when available and otherwise a local heuristic.

## Operational notes

- A new dated index is created for each run; existing dated indices are not overwritten.
- Only a fully ingested and verified index is promoted to the RAG alias.
- Keep `RAG_OCR_CACHE_DIR` on persistent storage in production to avoid repeating OCR requests after restarts.
- The EESR archive is a tracked runtime asset. Include it when building or running the application outside Docker as well.

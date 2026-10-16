# Catalogue
Tools, applications, datasets and publications of our department at the French Ministry of Higher Education, Research and Space.

## To run in local
Please create an `.env` file before running it locally
You need to have in your `.env` file a "NODE_AUTH_TOKEN" with a Github Personal Access Token (PAT) Classsic with the read:packages rights, see https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry.
See here : https://bun.com/guides/install/registry-scope.
/!\ The really last version of bun is needed
`bun upgrade`
`bun install --frozen-lockfile`
`bun run dev`

## To run in production mode
`bun run start`

## To build
`bun run build`

## To deploy in staging
Any commit on the "staging" branch will deploy in staging.

## To deploy in production

```sh
git switch main
git pull origin main --rebase --tags
git merge origin staging
npm version [patch|minor|major]
git push origin main --tags
git switch staging
git merge origin main
git push origin staging --tags
```

## To update the data
- Open Declic
- Go to "Flows" on the left side menu
- Find the "full-sync" flow and click on the "Trigger" button (no need to add anything in the input(JSON), just press "Trigger" again)
- RAG ingestion is currently a separate operation; "full-sync" does not trigger it. To update publication chunks, trigger "sync-rag" from Declic. It reads publications from the catalogue index and ingests eligible PDFs into the RAG index.
- OCR results are cached as plain JSON at `RAG_OCR_CACHE_DIR/<record_id>/<file_name>.json`; the default cache directory is `local/rag/ocr`. Set `RAG_OCR_CACHE_DIR` to the mounted persistent-volume path in each Declic worker. The cache key is only record ID and filename, so delete that JSON file if a PDF is replaced under the same filename and you need fresh OCR. To regenerate chunks for unchanged PDFs after changing the chunking logic, run `sync-rag` with `{"force_reindex": true}`; it reuses cached OCR when available and regenerates chunks and embeddings. Regular syncs continue to skip unchanged PDFs.
- The `/rag/` endpoint now performs vector and French lexical retrieval in Catalogue. The existing `FLASH_RAG_URL` and `FLASH_RAG_API_KEY` settings must remain available until staging comparison against the legacy service is complete.
- Staging cutover verification is pending: use representative French queries with and without topic, publication-type, and access-right filters; compare result counts, top source relevance/order, filter correctness, and latency before removing the legacy service configuration.
- Configure `ML_HUB_API_URL` and `ML_HUB_API_KEY` together for optional cross-encoder reranking; if the adapter is unavailable or fails, search falls back to lightweight reranking.
- Once the flow finished, a new ES index is created named "catalogue-YYYYMMDD"
- Simply move the aliases "catalogue-staging" then "catalogue" to the newly created ES index
- If everything works well, delete the n-2 ES index for catalogue

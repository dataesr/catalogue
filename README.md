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
- The "full-sync" flow triggers incremental RAG ingestion after all catalogue sources finish and the Zenodo sync reports no per-record errors. To run it separately, trigger the "sync-rag" flow; it reads publication records from the catalogue index and indexes only new or changed PDFs.
- The first RAG sync, or a full rebuild, creates and fills a new versioned Elasticsearch index, verifies the document count and sample chunks, and atomically moves the `rag-${ENV}` alias. The previous index is retained for rollback.
- To backfill/rebuild the corpus, pass `{"force_reindex": true}` to "sync-rag". This reprocesses every eligible PDF with OCR and embeddings before promoting the new index.
- To roll back, trigger "sync-rag" with `{"rollback_to": "rag-${ENV}-<version>"}` using the retained index name.
- Retrieval, vector/lexical search, fusion, and lightweight reranking run in Catalogue. Configure `ML_HUB_API_URL` and `ML_HUB_API_KEY` together to enable optional cross-encoder reranking; if the adapter is unavailable or fails, search falls back to lightweight reranking.
- Once the flow finished, a new ES index is created named "catalogue-YYYYMMDD"
- Simply move the aliases "catalogue-staging" then "catalogue" to the newly created ES index
- If everything works well, delete the n-2 ES index for catalogue

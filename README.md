# Catalogue
Tools, applications, datasets and publications of our department at the French Ministry of Higher Education, Research and Space.

## To run in local
Please create an `.env` file before running it locally
You need to have in your `.env` file a "NODE_AUTH_TOKEN" with a Github Personal Access Token (PAT) Classsic with the read:packages rights.
/!\ The really last version of bun is needed
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
- Once the flow finished, a new ES index is created named "catalogue-YYYYMMDD"
- Simply move the aliases "catalogue-staging" then "catalogue" to the newly created ES index
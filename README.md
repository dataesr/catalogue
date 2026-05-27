# Catalogue
Tools, applications, datasets and publications of our department at the French Ministry of Higher Education, Research and Space.

# To run in local
Please create an `.env` file before running it locally
You need to have in your `.env` file a "NODE_AUTH_TOKEN" with a Github Personal Access Token (PAT) Classsic with the read:packages rights.
/!\ The really last version of bun is needed
`bun install --frozen-lockfile`

`bun run dev`

# To run in production mode
`bun run start`

# To build
`bun run build`

# To deploy in staging
Any commit on the "staging" branch will deploy in staging.

# To deploy in production

```sh
git switch main
git pull origin main --rebase --tags
git merge origin staging
cd client
npm version [patch|minor|major]
cd ..
git add .
git tag -l (to get the tag list)
git commit -m '<new tag>'
git tag <new tag>
git push origin main --tags
git switch staging
git merge origin main
git push origin staging --tags
```
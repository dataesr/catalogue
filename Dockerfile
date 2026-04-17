# Stage 1: build
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    NODE_AUTH_TOKEN=$(cat /run/secrets/NODE_AUTH_TOKEN) bun install --frozen-lockfile

COPY . .

RUN bun build --compile --target=bun-linux-x64 server.ts --outfile=dist/server

# Stage 2: run
FROM gcr.io/distroless/cc-debian12:nonroot

WORKDIR /app

COPY --from=builder /app/dist/server ./server

EXPOSE 3000

ENTRYPOINT ["./server"]

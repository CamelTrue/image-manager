FROM rust:1.97-slim AS builder

RUN apt-get update && apt-get install -y pkg-config libsqlite3-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libsqlite3-dev ca-certificates && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash appuser
USER appuser
WORKDIR /app

COPY --from=builder /app/target/release/image-manager-backend .

ENV DATABASE_URL=data/database.sqlite
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080
ENV STORAGE_PATH=/data/images

EXPOSE 8080

CMD ["./image-manager-backend"]

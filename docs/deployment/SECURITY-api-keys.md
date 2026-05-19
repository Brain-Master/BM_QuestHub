# API keys and secrets

## Timeweb Cloud API key (JWT)

- Create and revoke keys only in the [Timeweb API keys panel](https://timeweb.cloud/my/api-keys).
- **Never** commit API keys, paste them in chat, or store them in tracked files.
- Use `TIMEWEB_API_TOKEN` in your shell or CI secrets for optional automation scripts.
- An API key is **not** the same as S3 **Access Key / Secret** from the bucket dashboard.

If a key was exposed, revoke it immediately and issue a new one.

## S3 upload credentials

- Store only in gitignored `scripts/s3.env` (see `scripts/s3.env.example`).
- Used by `make s3-sync-*` with AWS CLI and `--endpoint-url` for Timeweb Object Storage.

## App Platform

- Configure build env vars in the Timeweb panel; do not commit production values to the repo.

# Content producer

Publishes public snapshots to S3 and triggers the static site **content rebuild** workflow.

## Usage

```bash
# Hot: schedule JSON → S3 only (no Timeweb deploy)
make content-publish-hot

# Cold: export YAML + S3 + Timeweb API deploy
make content-publish

make timeweb-deploy   # deploy only
```

## Environment

Copy [`.env.example`](./.env.example). S3 credentials in `scripts/s3.env`.

Cold deploy: `TIMEWEB_API_TOKEN` + `TIMEWEB_APP_ID` in `scripts/timeweb.env`.

## Related

- [content-deploy.md](../../docs/deployment/content-deploy.md)
- [catalog-snapshot-contract.md](../../docs/data/catalog-snapshot-contract.md)

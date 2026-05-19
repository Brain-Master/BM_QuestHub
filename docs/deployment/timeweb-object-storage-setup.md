# Timeweb Object Storage — setup and sync

Primary public CDN storage for Quest Hub JSON and media. Site HTML is deployed via [App Platform](./timeweb-app-platform.md).

**Security:** [SECURITY-api-keys.md](./SECURITY-api-keys.md)  
**Pricing:** [timeweb-object-storage-pricing.md](./timeweb-object-storage-pricing.md)  
**Legacy (Yandex):** [yandex-object-storage-setup.md](./yandex-object-storage-setup.md)

## Connection

| Setting | Value |
|---------|--------|
| Endpoint | `https://s3.twcstorage.ru` |
| Region | `ru-1` |
| Public object URL (virtual-hosted) | `https://<bucket>.s3.twcstorage.ru/<key>` |
| Path-style | `https://s3.twcstorage.ru/<bucket>/<key>` |

Keys: bucket **Dashboard** in [S3 panel](https://timeweb.cloud/my/storage) — **Access Key** and **Secret Key** (not the Cloud API JWT).

## 1. Create bucket

1. [Create bucket](https://timeweb.cloud/docs/s3-storage/manage-storage/create-bucket) — name e.g. `bm-questhub`, class **Standard**, **public** read for anonymous HTTP.
2. Pick storage size tier (1 GB starter is enough initially).
3. Copy S3 credentials to `scripts/s3.env` from [`scripts/s3.env.example`](../../scripts/s3.env.example).

```bash
S3_BUCKET=bm-questhub
S3_ENDPOINT=https://s3.twcstorage.ru
AWS_DEFAULT_REGION=ru-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Set in App Platform / local build:

```text
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://bm-questhub.s3.twcstorage.ru
```

## 2. Bucket policy (public read)

Allow anonymous `GetObject` on public prefixes (adjust bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadDataMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::bm-questhub/data/*",
        "arn:aws:s3:::bm-questhub/media/*"
      ]
    }
  ]
}
```

Apply in bucket settings → access policy. See [bucket policies](https://timeweb.cloud/docs/s3-storage/supported-features/bucket-policies).

## 3. Object layout

```text
s3://bm-questhub/data/offers-snapshot.json
s3://bm-questhub/data/v2/site-manifest.json
s3://bm-questhub/data/v2/site-config.json
s3://bm-questhub/data/v2/schedule-snapshot.json
s3://bm-questhub/media/quests/<slug>/<file>
```

Local sources: `apps/web/data/`, `apps/web/media/`.

## 4. Upload

Requires [AWS CLI v2](https://aws.amazon.com/cli/).

```bash
make validate-snapshots
make s3-sync-data
make s3-sync-media   # skips if apps/web/media is empty
```

Verify:

```bash
curl -sI "https://bm-questhub.s3.twcstorage.ru/data/v2/site-manifest.json"
```

Publish V2 snapshots: upload all files, then **last** — `data/v2/site-manifest.json`.

## 5. Build-time env (App Platform / CI)

```text
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://bm-questhub.s3.twcstorage.ru
OFFERS_SNAPSHOT_SOURCE=s3
SITE_SNAPSHOT_SOURCE=s3
```

Do **not** put `AWS_*` in App Platform — the build only fetches public HTTP URLs.

## 6. CORS (optional)

Only if the **browser** will fetch S3 directly. Build-time `fetch` does not need CORS.

[Timeweb CORS guide](https://timeweb.cloud/docs/s3-storage/supported-features/cors-setup)

## Example bucket policy file

See [`scripts/timeweb-s3-bucket-policy.example.json`](../../scripts/timeweb-s3-bucket-policy.example.json).

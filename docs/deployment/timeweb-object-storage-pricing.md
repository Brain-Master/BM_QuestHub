# Timeweb Object Storage — pricing (Quest Hub)

**Checked:** 2026-05-19. Confirm current rates in the [S3 calculator](https://timeweb.cloud/services/s3-storage) and [pricing docs](https://timeweb.cloud/docs/s3-storage).

## Typical starter tier (from product UI)

| Item | Included / price |
|------|------------------|
| Standard storage | from **1 ₽/month** for **1 GB** tier |
| Outgoing traffic | often **0 ₽** up to **100 GB/month** on entry plans |
| S3 protocol | yes |
| Replication | triple replication (per product description) |

## Quest Hub hybrid (recommended)

| Component | Provider | Cost order |
|-----------|----------|------------|
| Next.js static site | Timeweb **App Platform** | from ~1 ₽/month (plan-dependent) |
| Public `data/` + `media/` | Timeweb **S3** | ~1 ₽/month at 1 GB |
| Lead forms | Yandex Cloud Function | separate Yandex billing |

Main cost driver at scale is **egress**, not storage, for both Timeweb S3 and site traffic.

## When to re-estimate

- Media grows beyond **1 GB** (next tier e.g. 10 GB ≈ 79 ₽/month in UI).
- Monthly egress approaches **100 GB**.
- You add Timeweb CDN in front of the bucket.

See [timeweb-object-storage-setup.md](./timeweb-object-storage-setup.md) for setup.

Legacy Yandex pricing notes: [yandex-object-storage-pricing.md](./yandex-object-storage-pricing.md).

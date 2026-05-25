#!/usr/bin/env node
/**
 * Create YMQ queues for MOS enrolled batch pipeline (AWS SQS-compatible API).
 *
 *   node scripts/provision-mos-ymq.mjs
 *   make provision-mos-ymq
 *
 * Requires: scripts/s3.env (static key with ymq.writer) or AWS_* env
 */
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  SetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv, loadS3Env } from "./load-dotenv.mjs";
import { createYmqClient } from "./lib/mos-ymq.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAIN_QUEUE = process.env.MOS_YMQ_QUEUE_NAME?.trim() || "bm-mos-enrolled-batch";
const DLQ_QUEUE = process.env.MOS_YMQ_DLQ_NAME?.trim() || "bm-mos-enrolled-batch-dlq";
const MAX_RECEIVE = Number(process.env.MOS_YMQ_MAX_RECEIVE || 3);

/**
 * @param {import("@aws-sdk/client-sqs").SQSClient} client
 * @param {string} name
 */
async function ensureQueueUrl(client, name) {
  try {
    const got = await client.send(new GetQueueUrlCommand({ QueueName: name }));
    if (got.QueueUrl) return got.QueueUrl;
  } catch {
    /* create */
  }
  const created = await client.send(new CreateQueueCommand({ QueueName: name }));
  if (!created.QueueUrl) throw new Error(`CreateQueue returned no URL for ${name}`);
  return created.QueueUrl;
}

/**
 * @param {import("@aws-sdk/client-sqs").SQSClient} client
 * @param {string} queueUrl
 */
async function queueArn(client, queueUrl) {
  const attrs = await client.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["QueueArn"],
    }),
  );
  const arn = attrs.Attributes?.QueueArn;
  if (!arn) throw new Error(`QueueArn missing for ${queueUrl}`);
  return arn;
}

async function main() {
  loadS3Env();
  const client = createYmqClient();
  if (!client) {
    console.error("[ymq] AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY missing (scripts/s3.env)");
    process.exit(1);
  }

  console.log(`[ymq] DLQ ${DLQ_QUEUE}`);
  const dlqUrl = await ensureQueueUrl(client, DLQ_QUEUE);
  const dlqArn = await queueArn(client, dlqUrl);

  console.log(`[ymq] main ${MAIN_QUEUE} (redrive → DLQ, maxReceive=${MAX_RECEIVE})`);
  const mainUrl = await ensureQueueUrl(client, MAIN_QUEUE);
  const mainArn = await queueArn(client, mainUrl);

  await client.send(
    new SetQueueAttributesCommand({
      QueueUrl: mainUrl,
      Attributes: {
        RedrivePolicy: JSON.stringify({
          deadLetterTargetArn: dlqArn,
          maxReceiveCount: MAX_RECEIVE,
        }),
      },
    }),
  );

  const out = path.join(ROOT, "secret", "mos-ymq.deploy.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    `# YMQ MOS pipeline — gitignored
MOS_YMQ_QUEUE_URL=${mainUrl}
MOS_YMQ_QUEUE_ARN=${mainArn}
MOS_YMQ_DLQ_URL=${dlqUrl}
MOS_YMQ_DLQ_ARN=${dlqArn}
# IAM: bm-mos-enrolled-sync-sa needs ymq.writer (planner), ymq.reader (worker trigger)
`,
    "utf8",
  );

  console.log(`[ymq] URL  ${mainUrl}`);
  console.log(`[ymq] ARN  ${mainArn}`);
  console.log(`[ymq] wrote ${path.relative(ROOT, out)}`);
}

main().catch((e) => {
  console.error("[ymq]", e.message || e);
  process.exit(1);
});

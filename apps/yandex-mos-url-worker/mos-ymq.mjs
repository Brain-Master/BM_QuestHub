import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const DEFAULT_ENDPOINT = "https://message-queue.api.cloud.yandex.net";
const DEFAULT_REGION = "ru-central1";

/**
 * @returns {SQSClient | null}
 */
export function createYmqClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) return null;
  return new SQSClient({
    region: process.env.MOS_YMQ_REGION?.trim() || DEFAULT_REGION,
    endpoint: process.env.MOS_YMQ_ENDPOINT?.trim() || DEFAULT_ENDPOINT,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function mosYmqQueueUrl() {
  return process.env.MOS_YMQ_QUEUE_URL?.trim() || "";
}

/**
 * @param {unknown} body
 */
export async function sendYmqMessage(body) {
  const queueUrl = mosYmqQueueUrl();
  if (!queueUrl) throw new Error("MOS_YMQ_QUEUE_URL not set");
  const client = createYmqClient();
  if (!client) throw new Error("YMQ credentials missing (AWS_ACCESS_KEY_ID)");
  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body),
    }),
  );
}

/**
 * @param {readonly unknown[]} bodies
 */
export async function sendYmqMessages(bodies) {
  for (const body of bodies) {
    await sendYmqMessage(body);
  }
}

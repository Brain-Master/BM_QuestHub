import { mosSyncTrace } from "./mos-sync-trace.mjs";

/**
 * Invoke bm-mos-enrolled-sync from controller (same service account).
 * Tries ?integration=async when enabled on sync version; otherwise awaits full sync (no client abort).
 * @param {{ dryRun?: boolean, useAsync?: boolean }} [opts]
 */
/**
 * @param {string} envName
 * @param {{ dryRun?: boolean, runId?: string }} [opts]
 */
export async function invokeMosPipelineFunction(envName, opts = {}) {
  const url = process.env[envName]?.trim();
  if (!url) throw new Error(`${envName} not set`);

  const token = await fetchYcfIamToken();
  const payload = JSON.stringify({
    source: "controller",
    dryRun: opts.dryRun === true,
    runId: opts.runId,
  });

  const wantAsync =
    process.env.MOS_SYNC_INVOKE_ASYNC !== "0";
  const plainUrl = url.split("?")[0];

  if (wantAsync) {
    return postInvoke(`${plainUrl}?integration=async`, token, payload, {
      asyncMode: true,
    });
  }
  return postInvoke(plainUrl, token, payload, { asyncMode: false });
}

export async function invokeMosSyncPlanner(opts = {}) {
  return invokeMosPipelineFunction("MOS_SYNC_PLANNER_FUNCTION_URL", opts);
}

/**
 * @param {{ dryRun?: boolean, runId?: string }} [opts]
 */
export async function invokeMosSyncFinalizer(opts = {}) {
  if (!opts.runId) throw new Error("invokeMosSyncFinalizer requires runId");
  return invokeMosPipelineFunction("MOS_SYNC_FINALIZER_FUNCTION_URL", opts);
}

export async function invokeMosEnrolledSync(opts = {}) {
  const url = process.env.MOS_ENROLLED_SYNC_FUNCTION_URL?.trim();
  if (!url) throw new Error("MOS_ENROLLED_SYNC_FUNCTION_URL not set");

  const token = await fetchYcfIamToken();
  const payload = JSON.stringify({
    source: "controller",
    dryRun: opts.dryRun === true,
  });

  const wantAsync =
    opts.useAsync !== false && process.env.MOS_SYNC_INVOKE_ASYNC !== "0";
  const plainUrl = url.split("?")[0];

  if (wantAsync) {
    const asyncResult = await postInvoke(`${plainUrl}?integration=async`, token, payload, {
      asyncMode: true,
    });
    mosSyncTrace("H1", "mos-sync-invoke.mjs:async", "async invoke result", {
      status: asyncResult.status,
      bodyKeys: asyncResult.body ? Object.keys(asyncResult.body) : [],
    });
    if (
      asyncResult.status === 412 &&
      String(asyncResult.body?.errorMessage || "").includes("async invocation is disabled")
    ) {
      mosSyncTrace("H5", "mos-sync-invoke.mjs:fallback", "async disabled on sync version", {});
      if (process.env.MOS_SYNC_ALLOW_SYNC_HTTP_FALLBACK?.trim() !== "1") {
        console.error(
          "[mos-invoke] async required — redeploy bm-mos-enrolled-sync with --async-service-account-id (sync HTTP hits ~90s limit)",
        );
        return {
          status: 503,
          body: {
            errorMessage:
              "async invocation disabled on bm-mos-enrolled-sync; redeploy with async-service-account-id",
          },
        };
      }
      console.warn("[mos-invoke] async disabled — MOS_SYNC_ALLOW_SYNC_HTTP_FALLBACK=1 sync HTTP");
    } else {
      return asyncResult;
    }
  }

  const syncResult = await postInvoke(plainUrl, token, payload, { asyncMode: false });
  mosSyncTrace("H1", "mos-sync-invoke.mjs:sync", "sync HTTP invoke finished", {
    status: syncResult.status,
  });
  return syncResult;
}

/**
 * @param {string} invokeUrl
 * @param {string} token
 * @param {string} payload
 * @param {{ asyncMode: boolean }} opts
 */
async function postInvoke(invokeUrl, token, payload, opts) {
  const fetchOpts = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload,
  };
  if (opts.asyncMode) {
    fetchOpts.signal = AbortSignal.timeout(15_000);
  }

  const res = await fetch(invokeUrl, fetchOpts);

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 500) };
  }

  if (typeof body === "object" && body?.body && typeof body.body === "string") {
    try {
      body = JSON.parse(body.body);
    } catch {
      /* keep wrapper */
    }
  }

  return { status: res.status, body };
}

async function fetchYcfIamToken() {
  const res = await fetch(
    "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  );
  if (!res.ok) {
    throw new Error(`IAM metadata ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error("no access_token in metadata");
  return data.access_token;
}

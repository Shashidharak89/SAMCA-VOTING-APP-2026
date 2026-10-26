const serverless = require("serverless-http");
const { app, connectToDatabase } = require("./server");

// Pre-warm database connection during Lambda container initialization (cold start)
// to reduce latency on the first incoming request
connectToDatabase().catch((err) => {
  console.warn("[Lambda Init] Background MongoDB connection warning:", err.message);
});

// Convert Express application into Lambda handler
const expressHandler = serverless(app, {
  binary: [
    "multipart/form-data",
    "image/*",
    "application/octet-stream",
    "application/pdf",
    "application/zip",
    "font/*",
  ],
});

exports.handler = async (event, context) => {
  // Allow Lambda to return without waiting for
  // MongoDB sockets/event-loop handles.
  context.callbackWaitsForEmptyEventLoop = false;

  // Handle CloudWatch/EventBridge warm-up pings to prevent cold starts
  if (
    event?.source === "aws.events" ||
    event?.warmup === true ||
    event?.ping === true ||
    event?.action === "warmup"
  ) {
    console.log("[Lambda] Warmup ping received. Container is warm.");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: "warm",
    };
  }

  try {
    // Normalize API Gateway stage prefixes (e.g. /prod or /dev)
    // so Express route paths (/api/...) match accurately
    if (event?.requestContext?.stage && event.requestContext.stage !== "$default") {
      const stagePrefix = `/${event.requestContext.stage}`;
      if (event.rawPath && event.rawPath.startsWith(stagePrefix)) {
        event.rawPath = event.rawPath.slice(stagePrefix.length) || "/";
      }
      if (event.path && event.path.startsWith(stagePrefix)) {
        event.path = event.path.slice(stagePrefix.length) || "/";
      }
    }

    const method =
      event?.requestContext?.http?.method ||
      event?.httpMethod ||
      "UNKNOWN";

    const path =
      event?.rawPath ||
      event?.path ||
      "/";

    console.log(`[Lambda] ${method} ${path}`);

    const response = await expressHandler(
      event,
      context
    );

    return response;
  } catch (err) {
    console.error("[Lambda Handler Error]:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-admin-password",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE,PATCH",
      },
      body: JSON.stringify({
        message: "Internal Server Error",
        error: err.message,
      }),
    };
  }
};
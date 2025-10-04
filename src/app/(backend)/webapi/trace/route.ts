import { TraceEventType } from '@/const/trace';
import { TraceClient } from '@/libs/traces';
import { TraceEventBasePayload, TraceEventPayloads } from '@/types/trace';

// Conditional import for 'after' function (available in Next.js 15+)
let after: ((callback: () => Promise<void>) => void) | undefined;
try {
  // @ts-ignore
  after = require('next/server').after;
} catch {
  // 'after' is not available in Next.js 14, will fallback to immediate execution
}

export const runtime = 'edge';

export const POST = async (req: Request) => {
  type RequestData = TraceEventPayloads & TraceEventBasePayload;
  const data = (await req.json()) as RequestData;
  const { traceId, eventType } = data;

  const traceClient = new TraceClient();

  const eventClient = traceClient.createEvent(traceId);

  switch (eventType) {
    case TraceEventType.ModifyMessage: {
      eventClient?.modifyMessage(data);
      break;
    }

    case TraceEventType.DeleteAndRegenerateMessage: {
      eventClient?.deleteAndRegenerateMessage(data);
      break;
    }

    case TraceEventType.RegenerateMessage: {
      eventClient?.regenerateMessage(data);
      break;
    }

    case TraceEventType.CopyMessage: {
      eventClient?.copyMessage(data);
      break;
    }
  }

  // Use 'after' if available (Next.js 15+), otherwise execute immediately
  if (after) {
    after(async () => {
      await traceClient.shutdownAsync();
    });
  } else {
    // Fallback for Next.js 14: execute cleanup immediately
    // Note: This may not be ideal for performance but ensures compatibility
    await traceClient.shutdownAsync();
  }

  return new Response(undefined, { status: 201 });
};

import { JWTPayload } from '@/const/auth';
import { AgentRuntime, ModelProvider } from '@/libs/model-runtime';
import { LobeVertexAI } from '@/libs/model-runtime/vertexai';
import { safeParseJSON } from '@/utils/safeParseJSON';

import { POST as UniverseRoute } from '../[provider]/route';

export const runtime = 'edge';

// due to the Chinese region does not support accessing Google
// we need to use proxy to access it
// refs: https://github.com/google/generative-ai-js/issues/29#issuecomment-1866246513
// if (process.env.HTTP_PROXY_URL) {
//   const { setGlobalDispatcher, ProxyAgent } = require('undici');
//
//   setGlobalDispatcher(new ProxyAgent({ uri: process.env.HTTP_PROXY_URL }));
// }

// Create the runtime function for VertexAI
const vertexAICreateRuntime = (jwtPayload: JWTPayload) => {
  const googleAuthStr = jwtPayload.apiKey ?? process.env.VERTEXAI_CREDENTIALS ?? undefined;

  const credentials = safeParseJSON(googleAuthStr);
  const googleAuthOptions = credentials ? { credentials } : undefined;

  const instance = LobeVertexAI.initFromVertexAI({
    googleAuthOptions,
    location: process.env.VERTEXAI_LOCATION,
    project: !!credentials?.project_id ? credentials?.project_id : process.env.VERTEXAI_PROJECT,
  });

  return new AgentRuntime(instance);
};

export const POST = async (req: Request) =>
  UniverseRoute(req, {
    createRuntime: vertexAICreateRuntime,
    params: Promise.resolve({ provider: ModelProvider.VertexAI }),
  });

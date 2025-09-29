import { checkAuth } from '@/app/(backend)/middleware/auth';
import { AgentRuntime, ModelProvider } from '@/libs/model-runtime';
import { LobeVertexAI } from '@/libs/model-runtime/vertexai';
import { safeParseJSON } from '@/utils/safeParseJSON';

import { POST as UniverseRoute } from '../[provider]/route';

export const POST: any = checkAuth(async (req: Request, { jwtPayload }) => {
  const createRuntime = () => {
    const googleAuthStr = jwtPayload.apiKey ?? process.env.VERTEXAI_CREDENTIALS ?? undefined;

    const credentials = safeParseJSON(googleAuthStr);
    const googleAuthOptions = credentials ? { credentials } : undefined;

    const instance = LobeVertexAI.initFromVertexAI({
      googleAuthOptions,
      location: process.env.VERTEXAI_LOCATION,
      project: credentials?.project_id ?? process.env.VERTEXAI_PROJECT,
    });

    return new AgentRuntime(instance);
  };

  return UniverseRoute(req, {
    createRuntime,
    params: { provider: ModelProvider.VertexAI },
  } as any);
});

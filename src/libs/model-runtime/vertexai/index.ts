// Dynamic import to prevent Node.js dependencies in client-side bundle
// import { VertexAI, VertexInit } from '@google-cloud/vertexai';
import { AgentRuntimeErrorType } from '../error';
import { LobeGoogleAI } from '../google';
import { AgentRuntimeError } from '../utils/createError';

export class LobeVertexAI extends LobeGoogleAI {
  static async initFromVertexAI(params?: any) {
    try {
      // Dynamic import to prevent Node.js dependencies in client-side bundle
      const { VertexAI } = await import('@google-cloud/vertexai');
      const client = new VertexAI({ ...params });

      return new LobeGoogleAI({ apiKey: 'avoid-error', client, isVertexAi: true });
    } catch (e) {
      const err = e as Error;

      if (err.name === 'IllegalArgumentError') {
        throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidVertexCredentials, {
          message: err.message,
        });
      }

      throw e;
    }
  }
}

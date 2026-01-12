import { createOpenAIEmbedding } from "@/lib/embeddings/openai";

export async function createEmbedding(input: string) {
  const provider = process.env.EMBEDDINGS_PROVIDER ?? "openai";

  if (provider === "openai") {
    return await createOpenAIEmbedding(input);
  }

  throw new Error(`Unsupported EMBEDDINGS_PROVIDER: ${provider}`);
}

export function vectorToSqlLiteral(vec: number[]) {
  return `[${vec.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}


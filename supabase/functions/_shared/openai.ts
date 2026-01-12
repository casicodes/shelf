type OpenAIEmbeddingResponse = {
  data: Array<{ embedding: number[] }>;
};

export async function createEmbedding(input: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, input })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as OpenAIEmbeddingResponse;
  const vec = json?.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length === 0) {
    throw new Error("Invalid embeddings response");
  }

  return { embedding: vec, model };
}

export function vectorToSqlLiteral(vec: number[]) {
  return `[${vec.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}


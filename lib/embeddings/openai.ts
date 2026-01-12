import { z } from "zod";

const OpenAIEmbeddingsResponseSchema = z.object({
  data: z
    .array(
      z.object({
        embedding: z.array(z.number())
      })
    )
    .min(1)
});

export type EmbeddingResult = {
  embedding: number[];
  model: string;
};

export async function createOpenAIEmbedding(input: string): Promise<EmbeddingResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const parsed = OpenAIEmbeddingsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("OpenAI embeddings response shape changed");
  }

  return { embedding: parsed.data.data[0].embedding, model };
}


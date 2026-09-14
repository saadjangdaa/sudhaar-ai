const TEXT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export type RedesignInput = {
  imageUrl: string;
  issueType: string;
  address: string;
  complaintText: string;
};

export type RedesignResult = { ok: true; solution: string } | { ok: false; error: string };

const SYSTEM_PROMPT =
  "You advise a Karachi municipal authority desk on how to physically resolve a " +
  "citizen-reported civic complaint. Write a short, concrete recommendation: what to " +
  "do, roughly what materials or crew are needed, and any safety note. 3-5 sentences, " +
  "plain prose, no headings or markdown, addressed to the authority reviewing the case.";

/**
 * Drafts a short repair recommendation for the crew, reading the citizen's photo
 * when there is one.
 *
 * No stub/flag here unlike verify-fix — this either has a working GEMINI_API_KEY
 * or it fails loudly naming exactly what's missing, per the api.ts precedent for
 * this repo: a silent fallback here would mean an admin sees a broken button with
 * no clue why.
 */
export async function redesignReport(input: RedesignInput): Promise<RedesignResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "GEMINI_API_KEY is not set on the server. Add it to web/.env.local (or the " +
        "hosting project's environment variables) and redeploy.",
    };
  }

  try {
    return { ok: true, solution: await draftSolution(apiKey, input) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI re-design failed.",
    };
  }
}

async function draftSolution(apiKey: string, input: RedesignInput): Promise<string> {
  const parts: Record<string, unknown>[] = [
    {
      text:
        `Issue type: ${issueLabel(input.issueType)}\n` +
        `Location: ${input.address}\n` +
        `Citizen's report: ${input.complaintText || "No further detail provided."}`,
    },
  ];

  // The photo is a bonus, not a precondition: reports without one still get a
  // recommendation from the text alone, and a photo that will not download
  // must not sink the whole call.
  if (input.imageUrl) {
    const image = await fetchImage(input.imageUrl).catch(() => null);
    if (image) {
      parts.push({ inline_data: { mime_type: image.mimeType, data: image.base64 } });
    }
  }

  const response = await fetch(`${ENDPOINT}/${TEXT_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Text model request failed (${response.status}): ${await safeErrorDetail(response)}`);
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!content) throw new Error("Text model returned no recommendation.");
  return content;
}

async function fetchImage(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch the report photo (${response.status}).`);
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { base64: buffer.toString("base64"), mimeType };
}

async function safeErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? JSON.stringify(body);
  } catch {
    return response.statusText;
  }
}

function issueLabel(issueType: string) {
  return issueType.replace(/_/g, " ");
}

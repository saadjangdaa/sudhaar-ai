const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const TEXT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export type RedesignInput = {
  imageUrl: string;
  issueType: string;
  address: string;
  complaintText: string;
};

export type RedesignResult =
  | { ok: true; imageDataUrl: string; solution: string }
  | { ok: false; error: string };

/**
 * Generates a "fixed" preview photo plus a short recommendation for the crew.
 *
 * No stub/flag here unlike verify-fix — this either has a working OPENAI_API_KEY
 * or it fails loudly naming exactly what's missing, per the api.ts precedent for
 * this repo: a silent fallback here would mean an admin sees a broken button with
 * no clue why.
 */
export async function redesignReport(input: RedesignInput): Promise<RedesignResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "OPENAI_API_KEY is not set on the server. Add it to web/.env.local (or the " +
        "hosting project's environment variables) and redeploy.",
    };
  }
  if (!input.imageUrl) {
    return { ok: false, error: "This report has no photo to work from." };
  }

  try {
    const [imageDataUrl, solution] = await Promise.all([
      generateFixedImage(apiKey, input),
      draftSolution(apiKey, input),
    ]);
    return { ok: true, imageDataUrl, solution };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI re-design failed.",
    };
  }
}

async function generateFixedImage(apiKey: string, input: RedesignInput): Promise<string> {
  const source = await fetchImage(input.imageUrl);

  const form = new FormData();
  form.append("model", IMAGE_MODEL);
  form.append(
    "image",
    new Blob([source.data], { type: source.mimeType }),
    `source.${extensionFor(source.mimeType)}`,
  );
  form.append("prompt", buildImagePrompt(input));
  form.append("n", "1");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Image model request failed (${response.status}): ${await safeErrorDetail(response)}`);
  }

  const payload = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image model returned no image data.");
  return `data:image/png;base64,${b64}`;
}

async function draftSolution(apiKey: string, input: RedesignInput): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You advise a Karachi municipal authority desk on how to physically resolve a " +
            "citizen-reported civic complaint. Write a short, concrete recommendation: what to " +
            "do, roughly what materials or crew are needed, and any safety note. 3-5 sentences, " +
            "plain prose, no headings or markdown, addressed to the authority reviewing the case.",
        },
        {
          role: "user",
          content:
            `Issue type: ${issueLabel(input.issueType)}\n` +
            `Location: ${input.address}\n` +
            `Citizen's report: ${input.complaintText || "No further detail provided."}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Text model request failed (${response.status}): ${await safeErrorDetail(response)}`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Text model returned no recommendation.");
  return content;
}

function buildImagePrompt(input: RedesignInput): string {
  return (
    `This photo shows a ${issueLabel(input.issueType)} civic issue in Karachi. ` +
    "Edit the photo to show the exact same location, camera angle, and surroundings, but with " +
    "the issue fully and professionally repaired: the road, drain, or area looks clean, safe, " +
    "and well-maintained. Keep it photorealistic — do not add labels, text, illustrations, or " +
    "people who were not already in the photo."
  );
}

async function fetchImage(url: string): Promise<{ data: ArrayBuffer; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch the report photo (${response.status}).`);
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return { data: await response.arrayBuffer(), mimeType };
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { filePath } = await req.json();
    if (!filePath) throw new Error("filePath is required");

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError || !fileData) throw new Error("Failed to download file");

    const fileName = filePath.split("/").pop() || "document";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    let extractedText = "";

    if (["txt", "md", "csv", "json", "xml", "html"].includes(ext)) {
      // Plain text files
      extractedText = await fileData.text();
    } else if (["pdf"].includes(ext)) {
      // For PDFs, extract raw text content
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      extractedText = extractTextFromPdfBytes(bytes);
      if (!extractedText.trim()) {
        extractedText = `[PDF document uploaded: ${fileName}. The text could not be fully extracted. Please describe the content of your document so I can help refine your pitch.]`;
      }
    } else if (["doc", "docx", "pptx", "xlsx"].includes(ext)) {
      extractedText = `[${ext.toUpperCase()} document uploaded: ${fileName}. Please describe the key content so I can help refine your pitch.]`;
    } else {
      extractedText = `[File uploaded: ${fileName}. Please describe the content so I can help you.]`;
    }

    // Truncate if too long
    if (extractedText.length > 15000) {
      extractedText = extractedText.slice(0, 15000) + "\n\n[Content truncated for processing]";
    }

    return new Response(JSON.stringify({ text: extractedText, fileName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  // Simple PDF text extraction - looks for text between BT/ET operators
  const text = new TextDecoder("latin1").decode(bytes);
  const textChunks: string[] = [];

  // Extract text from PDF stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const streamContent = match[1];
    // Look for text showing operators: Tj, TJ, '
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      textChunks.push(tjMatch[1]);
    }
  }

  // Also try to extract raw readable text
  const readableRegex = /\(([A-Za-z0-9\s.,!?;:'"()-]+)\)/g;
  let readableMatch;
  while ((readableMatch = readableRegex.exec(text)) !== null) {
    const chunk = readableMatch[1].trim();
    if (chunk.length > 3) {
      textChunks.push(chunk);
    }
  }

  return [...new Set(textChunks)].join(" ").trim();
}

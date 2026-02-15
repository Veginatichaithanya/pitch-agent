import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pitchMode, webSearch } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = `You are Pitch Agent, an AI-powered pitch refinement assistant. You help students, innovators, and ambitious creators turn their raw ideas into structured, compelling pitch drafts.

Your responses should be:
- Clear, professional, and well-structured
- Encouraging and constructive
- Focused on making ideas more compelling and presentable`;

    if (pitchMode) {
      systemPrompt += `

PITCH MODE IS ACTIVE. When the user shares an idea, generate EXACTLY 4 separate pitch drafts. Each draft should take a DIFFERENT angle or approach to pitching the same idea.

Use this EXACT format with delimiters:

---DRAFT_1---
## Problem
Clearly define the problem. Who is affected? Why does it matter?

## Solution
Describe the proposed solution. How does it work? What makes it unique?

## Users & Impact
Identify target users. What measurable impact will this have?

## Feasibility
Assess technical feasibility, resources, timeline, and challenges.

---DRAFT_2---
## Problem
(Different angle/framing of the problem)

## Solution
(Different emphasis or approach)

## Users & Impact
(Different target audience or impact metrics)

## Feasibility
(Different implementation strategy)

---DRAFT_3---
(Third unique angle)

---DRAFT_4---
(Fourth unique angle)

IMPORTANT RULES:
- Each draft MUST start with ---DRAFT_N--- delimiter
- Each draft should be a COMPLETE pitch with all 4 sections
- Each draft should have a DIFFERENT tone/angle: e.g. investor-focused, user-centric, technical, storytelling
- Make each section 3-5 sentences minimum with bullet points where helpful
- Be compelling and professional in all drafts`;
    }

    if (webSearch) {
      systemPrompt += `

WEB SEARCH MODE IS ACTIVE. You MUST act as a web-aware research assistant. For every response:

1. Provide a thorough, well-researched answer grounded in real-world information, current trends, data, and examples.
2. Reference specific companies, products, statistics, reports, and news when relevant.
3. At the VERY END of your response, add a "Sources" section in EXACTLY this format:

---SOURCES---
[Title of source 1](https://actual-real-url-1.com)
[Title of source 2](https://actual-real-url-2.com)
[Title of source 3](https://actual-real-url-3.com)
---END_SOURCES---

IMPORTANT: 
- Always include 3-6 real, relevant source URLs that support your response.
- Use REAL URLs from well-known sites (Wikipedia, Forbes, TechCrunch, Reuters, official docs, etc.)
- The sources section must be the last thing in your response.
- Do NOT include the sources section inside markdown headers.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

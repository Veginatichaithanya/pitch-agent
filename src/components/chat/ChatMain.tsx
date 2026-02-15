import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Paperclip, FileText, Globe, Sparkles, PanelLeftClose, PanelLeftOpen, X, File, ExternalLink, ChevronLeft, ChevronRight, AlignLeft, AlignJustify, Presentation, Gavel, Maximize2, Minimize2, Network } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const PROCESS_DOC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`;

interface ChatMainProps {
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface Message {
  id: string;
  role: string;
  content: string;
  is_pitch?: boolean;
  is_search?: boolean;
  created_at?: string;
}

const formatIST = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

interface SourceLink {
  title: string;
  url: string;
}

const parseSourcesFromContent = (content: string): { cleanContent: string; sources: SourceLink[] } => {
  const sourcesRegex = /---SOURCES---\n([\s\S]*?)---END_SOURCES---/;
  const match = content.match(sourcesRegex);
  if (!match) return { cleanContent: content, sources: [] };

  const cleanContent = content.replace(sourcesRegex, "").trim();
  const sourcesBlock = match[1].trim();
  const sources: SourceLink[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(sourcesBlock)) !== null) {
    sources.push({ title: m[1], url: m[2] });
  }
  return { cleanContent, sources };
};

const parseDrafts = (content: string): string[] => {
  const draftRegex = /---DRAFT_\d+---/g;
  const parts = content.split(draftRegex).filter((p) => p.trim());
  return parts.length > 1 ? parts : [];
};

const SLIDE_LABELS = ["Title", "Problem", "Solution", "Users & Impact", "Conclusion"];
const SLIDE_COLORS = [
  "from-[hsl(250,70%,60%)] to-[hsl(280,70%,55%)]",
  "from-[hsl(0,65%,55%)] to-[hsl(20,70%,50%)]",
  "from-[hsl(160,60%,42%)] to-[hsl(180,60%,40%)]",
  "from-[hsl(210,70%,55%)] to-[hsl(230,65%,50%)]",
  "from-[hsl(40,75%,50%)] to-[hsl(30,80%,45%)]",
];

const parseSlides = (content: string): string[] => {
  const slideRegex = /---SLIDE_\d+---/g;
  const parts = content.split(slideRegex).filter((p) => p.trim());
  return parts.length > 1 ? parts : [];
};

const parseMindMap = (content: string): string | null => {
  const regex = /---MINDMAP---([\s\S]*?)---END_MINDMAP---/;
  const match = content.match(regex);
  return match ? match[1].trim() : null;
};

const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return "";
  }
};

interface UploadedFile {
  name: string;
  path: string;
  extractedText?: string;
  processing?: boolean;
}

const ChatMain = ({
  conversationId,
  onConversationCreated,
  sidebarOpen,
  onToggleSidebar,
}: ChatMainProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pitchMode, setPitchMode] = useState(false);
  const [pitchLength, setPitchLength] = useState<"short" | "long">("short");
  const [presentationMode, setPresentationMode] = useState(false);
  const [judgeMode, setJudgeMode] = useState(false);
  const [judgeType, setJudgeType] = useState<"investor" | "academic" | "hackathon">("investor");
  const [webSearch, setWebSearch] = useState(false);
  const [mindMapMode, setMindMapMode] = useState(false);
  const [slideIndices, setSlideIndices] = useState<Record<string, number>>({});
  const [fullscreenSlide, setFullscreenSlide] = useState<{ msgId: string; slides: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [draftIndices, setDraftIndices] = useState<Record<string, number>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  // ── File Upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Please sign in to upload files.", variant: "destructive" });
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 20MB limit.`, variant: "destructive" });
        continue;
      }

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const newFile: UploadedFile = { name: file.name, path: filePath, processing: true };
      setUploadedFiles((prev) => [...prev, newFile]);

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setUploadedFiles((prev) => prev.filter((f) => f.path !== filePath));
        continue;
      }

      // Process document to extract text
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(PROCESS_DOC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ filePath }),
        });

        if (resp.ok) {
          const { text } = await resp.json();
          setUploadedFiles((prev) =>
            prev.map((f) => (f.path === filePath ? { ...f, extractedText: text, processing: false } : f))
          );
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.path === filePath ? { ...f, processing: false } : f))
          );
        }
      } catch {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.path === filePath ? { ...f, processing: false } : f))
        );
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (path: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.path !== path));
  };

  // ── Voice Input ──
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Speech recognition is not supported in this browser.", variant: "destructive" });
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setInput((prev) => {
        const base = prev.replace(/\s*\[listening...\]$/, "");
        return (finalTranscript + interim).trim() || base;
      });
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // ── Send Message ──
  const handleSend = async () => {
    const text = input.trim();
    if ((!text && uploadedFiles.length === 0) || loading) return;

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setInput("");
    setLoading(true);

    try {
      let convId = conversationId;

      if (!convId) {
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ title: text.slice(0, 50) || "Document analysis" })
          .select("id")
          .single();
        if (conv) {
          convId = conv.id;
          onConversationCreated(conv.id);
        }
      }

      if (!convId) return;

      // Build the full message content including document context
      let fullContent = text;
      const docContextParts: string[] = [];
      for (const file of uploadedFiles) {
        if (file.extractedText) {
          docContextParts.push(`[Document: ${file.name}]\n${file.extractedText}`);
        }
      }

      if (docContextParts.length > 0) {
        fullContent = `${text}\n\n--- Attached Documents ---\n${docContextParts.join("\n\n")}`;
      }

      // Save user message (display text only, not document content)
      const { data: userMsg } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: convId,
          role: "user",
          content: text || `[Uploaded: ${uploadedFiles.map((f) => f.name).join(", ")}]`,
          is_pitch: pitchMode,
          is_search: webSearch,
        })
        .select()
        .single();

      if (userMsg) {
        setMessages((prev) => [...prev, userMsg]);
      }

      // Clear uploaded files
      setUploadedFiles([]);

      // Build messages for AI
      const previousMessages = messages.map((m) => ({ role: m.role, content: m.content }));
      const aiMessages = [...previousMessages, { role: "user", content: fullContent }];

      // Stream AI response
      const { data: { session } } = await supabase.auth.getSession();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: aiMessages, pitchMode, pitchLength, presentationMode, judgeMode, judgeType, webSearch, mindMapMode }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.error || "Failed to get AI response", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;
      const tempId = `temp-${Date.now()}`;

      setMessages((prev) => [...prev, { id: tempId, role: "assistant", content: "", created_at: new Date().toISOString() }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, content: assistantContent } : m)));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, content: assistantContent } : m)));
            }
          } catch { /* ignore */ }
        }
      }

      // Save to DB
      if (assistantContent) {
        const { data: savedAi } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: convId,
            role: "assistant",
            content: assistantContent,
            is_pitch: pitchMode,
            is_search: webSearch,
          })
          .select()
          .single();
        if (savedAi) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? savedAi : m)));
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[hsl(220,20%,97%)] relative">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(220,15%,90%)]">
        <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-[hsl(220,15%,92%)] text-[hsl(220,10%,40%)] transition-colors">
          {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(250,70%,60%)]" />
          <span className="font-display font-semibold text-[hsl(220,15%,20%)] text-sm">Pitch Agent</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[hsl(220,15%,20%)] mb-2">How can I help you today?</h2>
              <p className="text-[hsl(220,10%,50%)] text-sm max-w-md">
                Enter your idea, upload a document, or use voice input. Toggle <strong>Pitch Mode</strong> for structured drafts.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center shrink-0 mt-1 shadow-md shadow-primary/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[hsl(250,70%,60%)] text-white rounded-br-md"
                        : "bg-white text-[hsl(220,15%,20%)] border border-[hsl(220,15%,90%)] shadow-sm rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      (() => {
                        const { cleanContent, sources } = parseSourcesFromContent(msg.content);
                        const mindMap = parseMindMap(cleanContent);
                        const drafts = parseDrafts(cleanContent);
                        const slides = parseSlides(cleanContent);
                        const currentDraftIdx = draftIndices[msg.id] || 0;
                        const currentSlideIdx = slideIndices[msg.id] || 0;

                        // Mind map rendering
                        if (mindMap) {
                          const lines = mindMap.split("\n");
                          return (
                            <div className="w-full min-w-[340px]">
                              <div className="bg-[hsl(45,30%,96%)] border border-[hsl(40,20%,85%)] rounded-2xl p-6 shadow-inner">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(40,20%,85%)]">
                                  <Network className="w-4 h-4 text-[hsl(250,70%,60%)]" />
                                  <span className="text-xs font-bold uppercase tracking-widest text-[hsl(220,10%,45%)]">Mind Map</span>
                                </div>
                                <pre className="font-mono text-sm leading-relaxed text-[hsl(220,15%,25%)] whitespace-pre-wrap overflow-x-auto [&]:bg-transparent [&]:p-0 [&]:m-0 [&]:border-0">
                                  {lines.map((line, i) => {
                                    const isCentral = line.includes("🎯");
                                    const isBranch = /[├└]──\s*[🔴💡👥🌍⚡✅]/.test(line);
                                    return (
                                      <span
                                        key={i}
                                        className={`block ${isCentral ? "text-lg font-bold text-[hsl(250,70%,50%)]" : isBranch ? "font-semibold text-[hsl(220,15%,20%)]" : ""}`}
                                      >
                                        {line}
                                      </span>
                                    );
                                  })}
                                </pre>
                              </div>
                            </div>
                          );
                        }

                        // Slide deck rendering
                        if (slides.length > 1) {
                          const slideContent = slides[currentSlideIdx] || "";
                          const slideLabel = SLIDE_LABELS[currentSlideIdx] || `Slide ${currentSlideIdx + 1}`;
                          const slideColor = SLIDE_COLORS[currentSlideIdx] || SLIDE_COLORS[0];

                          return (
                            <div className="w-full min-w-[340px]">
                              {/* Slide card - 16:9 aspect ratio */}
                              <div className={`relative bg-gradient-to-br ${slideColor} rounded-2xl shadow-2xl overflow-hidden`} style={{ aspectRatio: "16/9" }}>
                                <div className="absolute inset-0 bg-black/5" />
                                <div className="relative h-full flex flex-col p-8">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/70 bg-white/10 px-3 py-1 rounded-full">{slideLabel}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-bold text-white/90">
                                        {currentSlideIdx + 1} / {slides.length}
                                      </span>
                                      <button
                                        onClick={() => setFullscreenSlide({ msgId: msg.id, slides })}
                                        className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 hover:bg-white/30 transition-colors"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5 text-white" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex-1 flex items-center">
                                    <div className="prose prose-invert max-w-none w-full [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_p]:mb-2 [&_p]:text-base [&_ul]:mb-2 [&_ul]:space-y-1.5 [&_li]:text-base [&_li]:leading-relaxed [&_strong]:text-white">
                                      <ReactMarkdown>{slideContent}</ReactMarkdown>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Slide navigation */}
                              <div className="flex items-center justify-center gap-3 mt-4">
                                <button
                                  onClick={() => setSlideIndices((prev) => ({ ...prev, [msg.id]: Math.max(0, currentSlideIdx - 1) }))}
                                  disabled={currentSlideIdx === 0}
                                  className="w-9 h-9 rounded-full border border-[hsl(220,15%,85%)] flex items-center justify-center hover:bg-[hsl(220,15%,94%)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                  <ChevronLeft className="w-4 h-4 text-[hsl(220,10%,30%)]" />
                                </button>
                                <div className="flex gap-2">
                                  {slides.map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setSlideIndices((prev) => ({ ...prev, [msg.id]: i }))}
                                      className={`rounded-full transition-all ${i === currentSlideIdx ? "w-6 h-2.5 bg-[hsl(250,70%,60%)]" : "w-2.5 h-2.5 bg-[hsl(220,15%,78%)] hover:bg-[hsl(220,15%,60%)]"}`}
                                    />
                                  ))}
                                </div>
                                <button
                                  onClick={() => setSlideIndices((prev) => ({ ...prev, [msg.id]: Math.min(slides.length - 1, currentSlideIdx + 1) }))}
                                  disabled={currentSlideIdx === slides.length - 1}
                                  className="w-9 h-9 rounded-full border border-[hsl(220,15%,85%)] flex items-center justify-center hover:bg-[hsl(220,15%,94%)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                  <ChevronRight className="w-4 h-4 text-[hsl(220,10%,30%)]" />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        const displayContent = drafts.length > 0 ? drafts[currentDraftIdx] : cleanContent;

                        return (
                          <>
                            {drafts.length > 1 && (
                              <div className="flex items-center justify-center gap-3 mb-3 pb-2 border-b border-[hsl(220,15%,90%)]">
                                <button
                                  onClick={() => setDraftIndices((prev) => ({ ...prev, [msg.id]: Math.max(0, currentDraftIdx - 1) }))}
                                  disabled={currentDraftIdx === 0}
                                  className="w-8 h-8 rounded-lg border border-[hsl(220,15%,88%)] flex items-center justify-center hover:bg-[hsl(220,15%,94%)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="w-4 h-4 text-[hsl(220,10%,30%)]" />
                                </button>
                                <div className="text-center min-w-[120px]">
                                  <span className="text-sm font-semibold text-[hsl(220,15%,25%)] block leading-tight">
                                    Draft {currentDraftIdx + 1}
                                  </span>
                                  <span className="text-[10px] text-[hsl(250,60%,55%)] font-medium">
                                    {["Investor Focus", "Storytelling", "Data-Driven", "User-Centric"][currentDraftIdx] || `Angle ${currentDraftIdx + 1}`}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setDraftIndices((prev) => ({ ...prev, [msg.id]: Math.min(drafts.length - 1, currentDraftIdx + 1) }))}
                                  disabled={currentDraftIdx === drafts.length - 1}
                                  className="w-8 h-8 rounded-lg border border-[hsl(220,15%,88%)] flex items-center justify-center hover:bg-[hsl(220,15%,94%)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="w-4 h-4 text-[hsl(220,10%,30%)]" />
                                </button>
                              </div>
                            )}
                            <div className="prose prose-sm prose-slate max-w-none [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5">
                              <ReactMarkdown>{displayContent}</ReactMarkdown>
                            </div>
                            {sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-[hsl(220,15%,90%)]">
                                <p className="text-[11px] font-semibold text-[hsl(220,10%,50%)] mb-2 flex items-center gap-1">
                                  <Globe className="w-3 h-3" /> Sources
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {sources.map((src, i) => (
                                    <a
                                      key={i}
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[hsl(220,20%,96%)] hover:bg-[hsl(250,60%,95%)] border border-[hsl(220,15%,90%)] text-[11px] text-[hsl(250,70%,50%)] hover:text-[hsl(250,70%,40%)] transition-colors max-w-[220px] group"
                                    >
                                      <img src={getFavicon(src.url)} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                      <span className="truncate">{src.title}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.created_at && (
                    <span className={`text-[10px] px-1 ${msg.role === "user" ? "text-[hsl(220,10%,60%)] text-right" : "text-[hsl(220,10%,60%)]"}`}>
                      {formatIST(msg.created_at)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-[hsl(220,15%,90%)] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                {webSearch ? (
                  <div className="flex items-center gap-2 text-sm text-[hsl(220,10%,45%)]">
                    <Globe className="w-4 h-4 text-[hsl(250,70%,60%)] animate-spin" style={{ animationDuration: "2s" }} />
                    <span className="animate-pulse">Searching the web...</span>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[hsl(250,70%,60%)] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[hsl(250,70%,60%)] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[hsl(250,70%,60%)] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2 pb-2">
            {uploadedFiles.map((file) => (
              <div key={file.path} className="flex items-center gap-2 bg-white border border-[hsl(220,15%,88%)] rounded-lg px-3 py-1.5 text-xs text-[hsl(220,15%,30%)]">
                <File className="w-3.5 h-3.5 text-[hsl(250,70%,60%)]" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                {file.processing && <span className="text-[hsl(220,10%,60%)] animate-pulse">processing...</span>}
                <button onClick={() => removeFile(file.path)} className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,30%)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-[hsl(220,15%,88%)] rounded-2xl shadow-sm overflow-hidden">
            {/* Top row: textarea + action buttons */}
            <div className="flex items-end gap-2 px-4 pt-3 pb-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                rows={1}
                className="flex-1 resize-none text-sm text-[hsl(220,15%,20%)] placeholder:text-[hsl(220,10%,60%)] bg-transparent focus:outline-none py-1"
              />
              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} multiple accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.pptx,.xlsx" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)] transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button
                  onClick={toggleVoice}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "text-[hsl(220,10%,55%)] hover:bg-[hsl(220,15%,92%)]"
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && uploadedFiles.length === 0) || loading}
                  className="w-9 h-9 rounded-full gradient-btn flex items-center justify-center shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            {/* Bottom row: mode toggles */}
            <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
              <button
                onClick={() => setPitchMode(!pitchMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pitchMode
                    ? "bg-[hsl(250,70%,60%)] text-white shadow-md shadow-primary/20"
                    : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Pitch Mode
              </button>
              <button
                onClick={() => setWebSearch(!webSearch)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  webSearch
                    ? "bg-[hsl(250,70%,60%)] text-white shadow-md shadow-primary/20"
                    : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Web Search
              </button>
              <button
                onClick={() => setMindMapMode(!mindMapMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mindMapMode
                    ? "bg-[hsl(170,60%,42%)] text-white shadow-md shadow-[hsl(170,60%,42%)]/20"
                    : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Mind Map
              </button>
              {pitchMode && (
                <>
                  <div className="w-px h-5 bg-[hsl(220,15%,88%)]" />
                  <button
                    onClick={() => setPresentationMode(!presentationMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      presentationMode
                        ? "bg-[hsl(30,80%,50%)] text-white shadow-md shadow-[hsl(30,80%,50%)]/20"
                        : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                    }`}
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    Slides
                  </button>
                </>
              )}
              {pitchMode && !presentationMode && (
                <>
                  <div className="w-px h-5 bg-[hsl(220,15%,88%)]" />
                  <button
                    onClick={() => setPitchLength("short")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      pitchLength === "short"
                        ? "bg-[hsl(160,60%,45%)] text-white shadow-md shadow-[hsl(160,60%,45%)]/20"
                        : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    Short
                  </button>
                  <button
                    onClick={() => setPitchLength("long")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      pitchLength === "long"
                        ? "bg-[hsl(160,60%,45%)] text-white shadow-md shadow-[hsl(160,60%,45%)]/20"
                        : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                    }`}
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                    Long
                  </button>
                </>
              )}
              <div className="w-px h-5 bg-[hsl(220,15%,88%)]" />
              <button
                onClick={() => setJudgeMode(!judgeMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  judgeMode
                    ? "bg-[hsl(350,65%,50%)] text-white shadow-md shadow-[hsl(350,65%,50%)]/20"
                    : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                }`}
              >
                <Gavel className="w-3.5 h-3.5" />
                Judge
              </button>
              {judgeMode && (
                <>
                  <button
                    onClick={() => setJudgeType("investor")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      judgeType === "investor"
                        ? "bg-[hsl(350,65%,50%)] text-white shadow-sm"
                        : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                    }`}
                  >
                    💼 Investor
                  </button>
                  <button
                    onClick={() => setJudgeType("academic")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      judgeType === "academic"
                        ? "bg-[hsl(350,65%,50%)] text-white shadow-sm"
                        : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                    }`}
                  >
                    🎓 Academic
                  </button>
                  <button
                    onClick={() => setJudgeType("hackathon")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      judgeType === "hackathon"
                        ? "bg-[hsl(350,65%,50%)] text-white shadow-sm"
                        : "bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)]"
                    }`}
                  >
                    🏆 Hackathon
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Slide Overlay */}
      {fullscreenSlide && (() => {
        const fsIdx = slideIndices[fullscreenSlide.msgId] || 0;
        const fsContent = fullscreenSlide.slides[fsIdx] || "";
        const fsLabel = SLIDE_LABELS[fsIdx] || `Slide ${fsIdx + 1}`;
        const fsColor = SLIDE_COLORS[fsIdx] || SLIDE_COLORS[0];
        const fsTotal = fullscreenSlide.slides.length;

        const goNext = () => setSlideIndices((prev) => ({ ...prev, [fullscreenSlide.msgId]: Math.min(fsTotal - 1, fsIdx + 1) }));
        const goPrev = () => setSlideIndices((prev) => ({ ...prev, [fullscreenSlide.msgId]: Math.max(0, fsIdx - 1) }));

        return (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
              if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
              if (e.key === "Escape") setFullscreenSlide(null);
            }}
            tabIndex={0}
            ref={(el) => el?.focus()}
          >
            {/* Exit button */}
            <button
              onClick={() => setFullscreenSlide(null)}
              className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-colors"
            >
              <Minimize2 className="w-5 h-5 text-white" />
            </button>

            {/* Slide */}
            <div className="w-full max-w-5xl px-8">
              <div className={`relative bg-gradient-to-br ${fsColor} rounded-3xl shadow-2xl overflow-hidden`} style={{ aspectRatio: "16/9" }}>
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative h-full flex flex-col p-12 md:p-16">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm uppercase tracking-[0.25em] font-bold text-white/70 bg-white/10 px-4 py-1.5 rounded-full">{fsLabel}</span>
                    <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-bold text-white/90">
                      {fsIdx + 1} / {fsTotal}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="prose prose-lg prose-invert max-w-none w-full [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-5 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-4 [&_h3]:text-2xl [&_p]:mb-3 [&_p]:text-xl [&_ul]:mb-3 [&_ul]:space-y-3 [&_li]:text-xl [&_li]:leading-relaxed [&_strong]:text-white">
                      <ReactMarkdown>{fsContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                onClick={goPrev}
                disabled={fsIdx === 0}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex gap-3">
                {fullscreenSlide.slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndices((prev) => ({ ...prev, [fullscreenSlide.msgId]: i }))}
                    className={`rounded-full transition-all ${i === fsIdx ? "w-8 h-3 bg-white" : "w-3 h-3 bg-white/30 hover:bg-white/50"}`}
                  />
                ))}
              </div>
              <button
                onClick={goNext}
                disabled={fsIdx === fsTotal - 1}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Keyboard hint */}
            <p className="text-white/30 text-xs mt-6">Use ← → arrow keys to navigate · ESC to exit</p>
          </div>
        );
      })()}
    </div>
  );
};

export default ChatMain;

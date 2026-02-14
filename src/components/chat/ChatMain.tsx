import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, FileText, Globe, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

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
  const [webSearch, setWebSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    try {
      let convId = conversationId;

      if (!convId) {
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ title: text.slice(0, 50) })
          .select("id")
          .single();
        if (conv) {
          convId = conv.id;
          onConversationCreated(conv.id);
        }
      }

      if (!convId) return;

      // Save user message to DB
      const { data: userMsg } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: convId,
          role: "user",
          content: text,
          is_pitch: pitchMode,
          is_search: webSearch,
        })
        .select()
        .single();

      if (userMsg) {
        setMessages((prev) => [...prev, userMsg]);
      }

      // Build messages for AI (only role + content)
      const aiMessages = [...messages, { role: "user", content: text }].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Stream AI response
      const { data: { session } } = await supabase.auth.getSession();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: aiMessages, pitchMode, webSearch }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.error || "Failed to get AI response",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      // Stream tokens
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;
      const tempId = `temp-${Date.now()}`;

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { id: tempId, role: "assistant", content: "" }]);

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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...m, content: assistantContent } : m))
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
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
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...m, content: assistantContent } : m))
              );
            }
          } catch { /* ignore */ }
        }
      }

      // Save assistant message to DB
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
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? savedAi : m))
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
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

  // Auto-resize textarea
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
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-[hsl(220,15%,92%)] text-[hsl(220,10%,40%)] transition-colors"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(250,70%,60%)]" />
          <span className="font-display font-semibold text-[hsl(220,15%,20%)] text-sm">
            Pitch Agent
          </span>
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
              <h2 className="font-display text-2xl font-bold text-[hsl(220,15%,20%)] mb-2">
                How can I help you today?
              </h2>
              <p className="text-[hsl(220,10%,50%)] text-sm max-w-md">
                Enter your idea and I'll help you craft a compelling pitch. Toggle Pitch Mode for structured drafts.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center shrink-0 mt-1 shadow-md shadow-primary/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[hsl(250,70%,60%)] text-white rounded-br-md"
                      : "bg-white text-[hsl(220,15%,20%)] border border-[hsl(220,15%,90%)] shadow-sm rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-slate max-w-none [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-[hsl(220,15%,90%)] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[hsl(250,70%,60%)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[hsl(250,70%,60%)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[hsl(250,70%,60%)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-[hsl(220,15%,88%)] rounded-2xl shadow-sm overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              rows={1}
              className="w-full resize-none px-4 pt-4 pb-2 text-sm text-[hsl(220,15%,20%)] placeholder:text-[hsl(220,10%,60%)] bg-transparent focus:outline-none"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1.5">
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
              </div>

              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(220,15%,94%)] text-[hsl(220,10%,40%)] hover:bg-[hsl(220,15%,90%)] transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button className="p-2 rounded-lg text-[hsl(220,10%,55%)] hover:bg-[hsl(220,15%,92%)] transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-full gradient-btn flex items-center justify-center shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[hsl(220,10%,60%)] text-[11px] mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMain;

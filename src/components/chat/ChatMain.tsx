import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, FileText, Globe, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

      // Placeholder AI response
      const { data: aiMsg } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: convId,
          role: "assistant",
          content: "I'm your AI Pitch Agent. I'll help you refine your ideas into compelling pitches. This is a placeholder response — connect an AI backend to get real responses.",
          is_pitch: pitchMode,
          is_search: webSearch,
        })
        .select()
        .single();

      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
          {messages.length === 0 ? (
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
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
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

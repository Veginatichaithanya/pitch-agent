import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MessageSquare, Settings, LogOut, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ChatSidebarProps {
  open: boolean;
  onToggle: () => void;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

const ChatSidebar = ({
  open,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: ChatSidebarProps) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchConversations();
    fetchUser();
  }, []);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data);
  };

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User"
      );
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filtered = conversations.filter((c) =>
    (c.title || "New Chat").toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <aside className="w-64 h-full flex flex-col bg-background border-r border-border shrink-0">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full gradient-btn rounded-xl justify-start gap-2 font-semibold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2">
        <p className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent
        </p>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            No conversations yet
          </p>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left mb-0.5 ${
                activeConversationId === conv.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">{conv.title || "New Chat"}</span>
            </button>
          ))
        )}
      </div>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm text-foreground truncate flex-1">{userName}</span>
          <button
            onClick={() => {}}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;

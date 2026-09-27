import React, { useState, useEffect, useCallback } from "react";
import { Heart, MapPin, Camera, Award, Lightbulb, Plus, Globe, Lock } from "lucide-react";
import type { CommunityPost } from "../types";
import { fetchCommunityPosts, createCommunityPost, likeCommunityPost } from "../services/api";

const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  achievement: Award,
  recipe: Lightbulb,
  walk: MapPin,
  milestone: Camera,
  tip: Lightbulb,
};

const TYPE_COLORS: Record<string, string> = {
  achievement: "bg-[#E0F2F1] text-[#00897B]",
  recipe: "bg-[#FFF5F2] text-[#D9532F]",
  walk: "bg-[#E0F2F1] text-[#00695C]",
  milestone: "bg-[#F4FBF9] text-[#00897B]",
  tip: "bg-[#FFF5F2] text-[#D9532F]",
};

const TYPE_LABELS: Record<string, string> = {
  achievement: "Conquista",
  recipe: "Receita",
  walk: "Caminhada",
  milestone: "Marco",
  tip: "Dica",
};

interface CommunityFeedProps {
  patientId: string;
  idToken?: () => Promise<string | undefined>;
  authorName?: string;
  onToast?: (msg: string, type?: "success" | "error") => void;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ patientId, idToken, authorName, onToast }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<CommunityPost["type"]>("achievement");
  const [newPostVisibility, setNewPostVisibility] = useState<CommunityPost["visibility"]>("community");
  const [isPosting, setIsPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const token = await idToken?.();
      const data = await fetchCommunityPosts(patientId, token);
      setPosts(data);
    } catch {
      // Silencioso — feed vazio é aceitável
    }
  }, [patientId, idToken]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    if (!patientId) {
      onToast?.("Conecte um familiar antes de publicar.", "error");
      return;
    }
    setIsPosting(true);
    try {
      const token = idToken ? await idToken() : undefined;
      const post = await createCommunityPost(
        patientId, newPostContent.trim(), newPostType, token, newPostVisibility, authorName
      );
      if (post) {
        setPosts((prev) => [post, ...prev]);
        setNewPostContent("");
        setShowComposer(false);
      } else {
        onToast?.("Não foi possível publicar. Verifique sua conexão.", "error");
      }
    } catch {
      onToast?.("Não foi possível publicar. Verifique sua conexão.", "error");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (post: CommunityPost) => {
    if (post.isLikedByViewer) return;
    try {
      const token = idToken ? await idToken() : undefined;
      const { success } = await likeCommunityPost(post.id, token);
      if (!success) {
        onToast?.("Não foi possível curtir agora.", "error");
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likes: p.likes + 1, isLikedByViewer: true }
            : p
        )
      );
    } catch {
      onToast?.("Não foi possível curtir agora.", "error");
    }
  };

  const visibilityButtonClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
      active ? "bg-[#E0F2F1] text-[#00897B] border border-[#00897B]/30" : "bg-[#E5EBE8] text-[#64748B]"
    }`;

  return (
    <section className="rounded-2xl border border-[#E5EBE8] bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E5EBE8]">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Comunidade Braga Saúde</h2>
          <p className="text-xs text-[#64748B]">
            Celebre conquistas, receitas e dicas do seu familiar
          </p>
        </div>
        {patientId && (
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#00695C] hover:underline"
          >
            <Plus className="w-4 h-4" />
            Publicar
          </button>
        )}
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="p-4 border-b border-[#E5EBE8] bg-[#F8FAFC] space-y-3">
          {/* Visibilidade: comunidade inteira ou só o Circulo Familiar */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setNewPostVisibility("community")}
              className={visibilityButtonClass(newPostVisibility === "community")}
            >
              <Globe className="w-3.5 h-3.5" />
              Comunidade
            </button>
            <button
              type="button"
              onClick={() => setNewPostVisibility("family")}
              className={visibilityButtonClass(newPostVisibility === "family")}
            >
              <Lock className="w-3.5 h-3.5" />
              Privado — só minha família
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(Object.keys(TYPE_LABELS) as CommunityPost["type"][]).map((type) => {
              const Icon = TYPE_ICONS[type] || Lightbulb;
              const isActive = newPostType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewPostType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive ? TYPE_COLORS[type] : "bg-[#E5EBE8] text-[#64748B]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Comemore uma conquista do seu familiar..."
            className="w-full bg-white border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-[#1E293B] focus:border-[#00695C] outline-none resize-none"
            rows={3}
          />
          <button
            onClick={handlePost}
            disabled={isPosting || !newPostContent.trim()}
            className="bg-[#00695C] hover:bg-[#00897B] disabled:opacity-50 text-white font-bold text-sm rounded-xl px-6 py-2 transition-all"
          >
            {isPosting ? "Publicando..." : "Publicar"}
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="divide-y divide-[#E5EBE8]">
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#64748B]">
              Ainda não há publicações. Seja o primeiro a compartilhar!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const Icon = TYPE_ICONS[post.type] || Lightbulb;
            const colorClass = TYPE_COLORS[post.type] || TYPE_COLORS.achievement;
            return (
              <article key={post.id} className="p-4 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1E293B]">{post.authorName}</span>
                      <span className="text-xs text-[#64748B]">{post.authorRelation}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                        {TYPE_LABELS[post.type]}
                      </span>
                      {post.visibility === "family" && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E0F2F1] text-[#00695C]">
                          <Lock className="w-3 h-3" />
                          Família • Privado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#1E293B] mt-1 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleLike(post)}
                        disabled={post.isLikedByViewer}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          post.isLikedByViewer
                            ? "text-[#D9532F] cursor-default"
                            : "text-[#64748B] hover:text-[#D9532F]"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.isLikedByViewer ? "fill-current" : ""}`} />
                        {post.likes}
                      </button>
                      <span className="text-xs text-[#64748B]">
                        {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

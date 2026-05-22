import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction } from "@/application/actions";
import { ChatPanel } from "@/components/features/chat/ChatPanel";

export default async function ActionChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const threads = await repos.chat.getThreads(id);
  const defaultThread = threads.find((t) => t.is_default) ?? threads[0];

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-auto flex flex-col gap-4 min-h-0">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Chat</h1>
        <p className="text-sm text-[var(--muted)] mt-1">{action.title}</p>
      </div>
      {user && (
        <ChatPanel
          actionId={id}
          threads={threads}
          defaultThreadId={defaultThread?.id ?? null}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}

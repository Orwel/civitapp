"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  editable?: boolean;
  onChange?: (html: string, json: Record<string, unknown>) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  editable = true,
  onChange,
  placeholder = "Redacta el contenido de la acción…",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Typography,
    ],
    content: content || "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML(), ed.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || !content) return;
    if (editor.getHTML() !== content && content !== "<p></p>") {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {editable && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-[var(--border)] bg-[var(--surface-hover)]/50">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
          >
            B
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
          >
            I
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
          >
            U
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}>
            •
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1.
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            &ldquo;
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarBtn>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none p-4 min-h-[280px] focus:outline-none",
          "[&_.ProseMirror]:min-h-[260px] [&_.ProseMirror]:outline-none"
        )}
      />
      {editable && (
        <p className="text-[10px] text-[var(--muted)] px-3 py-1 border-t border-[var(--border)]">
          {editor.storage.characterCount.characters()} caracteres
        </p>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded text-xs font-bold",
        active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--surface-hover)]"
      )}
    >
      {children}
    </button>
  );
}

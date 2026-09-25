import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const extensions = [StarterKit];

export interface EditorProps {
  handleEditorChange: (content: string) => void;
  content: string;
}

export default function Editor({ handleEditorChange, content }: EditorProps) {
  const editor = useEditor({
    content: content,
    extensions: extensions,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleEditorChange(html);
    },
  });

  useEffect(() => {
  if (editor && content !== editor.getHTML()) {
    // Pass `false` so setContent doesn't emit an onUpdate event back to the parent
    editor.commands.setContent(content, false);
  }
}, [content, editor]);

if (!editor) return null; // Render nothing until the editor is initialized

  return <EditorContent editor={editor} />;
}


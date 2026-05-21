import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import PropTypes from "prop-types";
import { useEffect } from "react";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLink,
  MdTitle,
} from "react-icons/md";

const ToolbarButton = ({ onClick, active, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 md:p-1.5 rounded transition-colors shrink-0 ${
      active
        ? "bg-[#f6b100]/20 text-[#f6b100]"
        : "text-[#ababab] hover:bg-[#2a2a2a] hover:text-[#f5f5f5]"
    }`}
  >
    {children}
  </button>
);

ToolbarButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  active: PropTypes.bool,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
};

const DocsEditor = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Start writing your document...",
      }),
    ],
    content: content || "",
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[240px] lg:min-h-[320px] px-4 py-3 focus:outline-none text-[#f5f5f5]",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="border border-[#343434] rounded-xl overflow-hidden bg-[#1a1a1a]">
      {editable && (
        <div className="flex items-center gap-1 px-2 py-2 border-b border-[#343434] bg-[#1f1f1f] overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 flex-nowrap min-w-max">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold"
            >
              <MdFormatBold size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic"
            >
              <MdFormatItalic size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor.isActive("heading", { level: 2 })}
              title="Heading"
            >
              <MdTitle size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet list"
            >
              <MdFormatListBulleted size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Numbered list"
            >
              <MdFormatListNumbered size={18} />
            </ToolbarButton>
            <ToolbarButton
              onClick={setLink}
              active={editor.isActive("link")}
              title="Link"
            >
              <MdLink size={18} />
            </ToolbarButton>
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

DocsEditor.propTypes = {
  content: PropTypes.string,
  onChange: PropTypes.func,
  editable: PropTypes.bool,
};

export default DocsEditor;

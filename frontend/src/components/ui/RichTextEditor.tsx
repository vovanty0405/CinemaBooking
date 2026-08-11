import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Heading1, Heading2, Heading3, Undo, Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const COLORS = [
  '#FFFFFF', // Trắng
  '#E50914', // Đỏ Netflix
  '#B3B3B3', // Xám
  '#F5A623', // Vàng / Gold
  '#14B8A6', // Teal
  '#8B5CF6'  // Tím
];

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const handleAddImage = () => {
    const url = window.prompt('URL hình ảnh:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleAddLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL Liên kết:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolbarButton = ({ onClick, isActive, disabled, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded transition-colors ${
        isActive 
          ? 'bg-brand-red text-white' 
          : 'text-[#B3B3B3] hover:bg-[#2B2B2B] hover:text-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-[#1F1F1F] border border-dark-input rounded-t-lg p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
        <UnderlineIcon size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
        <Strikethrough size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-dark-input mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>
        <Heading3 size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-dark-input mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}>
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}>
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}>
        <AlignRight size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })}>
        <AlignJustify size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-dark-input mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
        <ListOrdered size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-dark-input mx-1" />

      <ToolbarButton onClick={handleAddLink} isActive={editor.isActive('link')}>
        <LinkIcon size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={handleAddImage}>
        <ImageIcon size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-dark-input mx-1" />
      
      {/* Mảng màu */}
      <div className="flex gap-1 items-center px-1">
        {COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => editor.chain().focus().setColor(color).run()}
            className={`w-5 h-5 rounded-full border border-dark-input transition-transform hover:scale-110 ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-white scale-110' : ''}`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      <div className="flex-1" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo size={16} />
      </ToolbarButton>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-red underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto mx-auto my-4',
        },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none max-w-none min-h-[300px] p-4 text-white bg-[#141414]',
      },
    },
  });

  // Keep editor content in sync if value prop changes externally (e.g. initial load)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="flex flex-col border border-dark-input rounded-lg overflow-hidden focus-within:border-brand-red transition-colors">
      <MenuBar editor={editor} />
      <div className="max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

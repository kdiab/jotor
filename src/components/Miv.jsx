import { useState, useMemo } from 'react';
import { Editor, Transforms, Element, createEditor, Point, Range, Node } from 'slate';
import { Slate, Editable, withReact, useSlate, useReadOnly, useSlateStatic, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import isHotkey from 'is-hotkey';
import ScreenCapture from './ScreenCapture';

const Miv = () => {
  const [editor] = useState(() => withChecklists(withHistory(withReact(createEditor()))));
  const initialValue = useMemo(
    () => JSON.parse(localStorage.getItem('content')) || [
      {"type":"paragraph","align":"left","checked":false,"children":[{"marks":[],"text":"TEST"}]},{"type":"h1","align":"left","checked":false,"children":[{"marks":[],"text":"1"}]},{"type":"h2","align":"left","children":[{"text":"2","marks":[]}]},{"type":"paragraph","align":"left","children":[{"text":"BOLD","marks":[],"bold":true}]},{"type":"paragraph","align":"left","children":[{"text":"italic","marks":[],"italic":true}]},{"type":"paragraph","align":"left","children":[{"text":"underline","marks":[],"underline":true}]},{"type":"paragraph","align":"left","children":[{"text":"<code>","marks":[],"code":true}]},{"type":"check-list","align":"left","children":[{"text":"Check","marks":[]}]},{"type":"check-list","align":"left","children":[{"marks":[],"text":"List"}],"checked":true},{"type":"block-quote","align":"left","children":[{"text":"Quote","marks":[]}]},{"type":"numbered-list","children":[{"type":"list-item","align":"left","children":[{"marks":[],"text":"list"}]}]},{"type":"bulleted-list","children":[{"type":"list-item","align":"left","children":[{"marks":[],"text":"bullet list"}]}]},{"type":"list-item","align":"left","children":[{"text":"left","marks":[]}]},{"type":"list-item","align":"center","children":[{"marks":[],"text":"center"}]},{"type":"list-item","align":"right","children":[{"marks":[],"text":"right"}]},{"type":"list-item","align":"justify","children":[{"marks":[],"text":"justify"}]},{"type":"list-item","children":[{"marks":[],"text":""}]}]
    ,
    []
  );
  return (
    <Slate
      editor={editor}
      initialValue={initialValue}
      onChange={(value) => {
        const isAstChange = editor.operations.some((op) => 'set_selection' !== op.type);
        if (isAstChange) {
          const content = JSON.stringify(value);
          localStorage.setItem('content', content);
        }
      }}
    >
      <ScreenCapture />
      <BlockButton format="h1" />
      <BlockButton format="h2" />
      <MarkButton format="bold" />
      <MarkButton format="italic" />
      <MarkButton format="underline" />
      <MarkButton format="code" />
      <BlockButton format="check-list" />
      <BlockButton format="block-quote" />
      <BlockButton format="numbered-list" />
      <BlockButton format="bulleted-list" />
      <BlockButton format="left" />
      <BlockButton format="center" />
      <BlockButton format="right" />
      <BlockButton format="justify" />
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        spellCheck
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const currentBlock = Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
            console.log(currentBlock)
            const newLine = {
                  type: "paragraph",
                  align: "left",
                  children: [
                    {
                      text: "",
                      marks: []
                    }
                  ]
            };
            switch(currentBlock.type) {
              case 'h1': 
              case 'h2':
              case 'h3':
              case 'h4':
              case 'h5':
                e.preventDefault()
                Transforms.insertNodes(editor, newLine);
                break;
              case 'list-item':
              case 'check-list':
                if (currentBlock.children[0].text === '') {
                  e.preventDefault()
                  Transforms.removeNodes(editor)
                  Transforms.insertNodes(editor, newLine);
                  toggleBlock(editor, 'list-item');  
                }
                break;
              default:
                return;
          }
        } else if (e.key === 'Backspace'){
            const currentBlock = Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
            switch(currentBlock.type) {
              case 'list-item':
                  if (currentBlock.children[0].text === '') {
                    toggleBlock(editor, 'list-item');  
                  }
                  break;
              default:
                return;
            }
          } else {
            for (const key in HOTKEYS) {
              if (isHotkey(key, e)) {
                e.preventDefault();
                const mark = HOTKEYS[key];
                toggleMark(editor, mark);
              }
            }
          }
        }}
      />
    </Slate>
  );
};

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code'
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

const Blocks = ({ attributes, children, element }) => {
  const style = { textAlign: element.align };
  const props = { attributes, children, element }
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case 'h1':
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      );
    case 'h2':
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case 'h3':
          return (
            <h3 style={style} {...attributes}>
              {children}
            </h3>
          );
    case 'h4':
          return (
            <h4 style={style} {...attributes}>
              {children}
            </h4>
          );
    case 'h5':
          return (
            <h5 style={style} {...attributes}>
              {children}
            </h5>
          );
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case 'numbered-list':
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    case 'check-list':
      return <CheckList {...props} />
    case 'paragraph':
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      LIST_TYPES.includes(n.type),
    split: true,
  });

  let newProperties;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
  }
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const BlockButton = ({ format }) => {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type');
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray',
        color: 'white',
        border: 'none',
        padding: '10px',
        cursor: 'pointer',
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {format}
    </button>
  );
};

const MarkButton = ({ format }) => {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray',
        color: 'white',
        border: 'none',
        padding: '10px',
        cursor: 'pointer',
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, format);
      }}
    >
      {format}
    </button>
  );
};

const renderElement = (props) => {
  return <Blocks {...props} />;
};

const renderLeaf = (props) => {
  return <Leaf {...props} />;
};

const withChecklists = editor => {
  const { deleteBackward } = editor

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n =>
          !Editor.isEditor(n) &&
          Element.isElement(n) &&
          (n.type === 'check-list' || n.type === 'list-item')
      })

      if (match) {
        const [, path] = match
        const start = Editor.start(editor, path)

        if (Point.equals(selection.anchor, start)) {
          const newProperties = {
            type: 'paragraph',
          }
          Transforms.setNodes(editor, newProperties, {
            match: n =>
              !Editor.isEditor(n) &&
              Element.isElement(n) &&
              (n.type === 'check-list' || n.type === 'list-item')
          })
          return
        }
      }
    }

    deleteBackward(...args)
  }

  return editor
}

const CheckList = ({ attributes, children, element }) => {
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const { checked = false } = element; // Default to false if checked is undefined

  return (
    <div
      {...attributes}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <span
        contentEditable={false}
        style={{
          marginRight: '0.75em',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={event => {
            const path = ReactEditor.findPath(editor, element);
            const newProperties = {
              checked: event.target.checked,
            };
            Transforms.setNodes(editor, newProperties, { at: path });
          }}
        />
      </span>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        style={{
          flex: 1,
          opacity: checked ? 0.666 : 1,
          textDecoration: checked ? 'line-through' : 'none',
        }}
      >
        {children}
      </span>
    </div>
  );
};

export default Miv;


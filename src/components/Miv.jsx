import { useState, useMemo } from 'react';
import { Editor, Transforms, Element, createEditor } from 'slate';
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import isHotkey from 'is-hotkey';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

const Blocks = ({ attributes, children, element }) => {
  const style = { textAlign: element.align };
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
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

const Leaf = (props) => {
  return (
    <span {...props.attributes} style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}>
      {props.children}
    </span>
  );
};

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

const renderElement = (props) => {
  return <Blocks {...props} />;
};

const renderLeaf = (props) => {
  return <Leaf {...props} />;
};

const Miv = () => {
  const [editor] = useState(() => withReact(createEditor()));
  const initialValue = useMemo(
    () => JSON.parse(localStorage.getItem('content')) || [
      {
        type: 'paragraph',
        children: [{ text: 'TYPE SOMETHING IDIOT' }],
      },
    ],
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
      <BlockButton format="h1" />
      <BlockButton format="h2" />
      <BlockButton format="h3" />
      <BlockButton format="h4" />
      <BlockButton format="h5" />
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
          for (const key in HOTKEYS) {
            if (isHotkey(key, e)) {
              e.preventDefault();
              const mark = HOTKEYS[key];
              toggleMark(editor, mark);
            }
          }
        }}
      />
    </Slate>
  );
};

export default Miv;


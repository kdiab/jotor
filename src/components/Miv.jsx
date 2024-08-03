import { useState, useMemo, useEffect } from 'react';
import { Editor, Transforms, Element, createEditor, Point, Range, Node } from 'slate';
import { Slate, Editable, withReact, useSlate, useReadOnly, useSlateStatic, ReactEditor} from 'slate-react';
import { ImageUploadButton, ImageElement, InsertImage, IsImageUrl } from './Image';
import { withHistory } from 'slate-history';
import isHotkey from 'is-hotkey';
import ScreenCapture from './ScreenCapture';

import './Miv.css';

let Miv = () => {
  let [recognizedText, setRecognizedText] = useState(null);
  let [image, setImage] = useState(null);
  let [editor] = useState(() => withImages(withChecklists(withHistory(withReact(createEditor())))));

  let handleTextRecognition = (text) => {
    setRecognizedText(text);
  };
  
  let handleImageCapture = (img) => {
    setImage(img);
  };


  let initialValue = useMemo(
    () => JSON.parse(localStorage.getItem('content')) || [
      {"type":"paragraph","align":"left","checked":false,"children":[{"marks":[],"text":"TEST"}]},{"type":"h1","align":"left","checked":false,"children":[{"marks":[],"text":"1"}]},{"type":"h2","align":"left","children":[{"text":"2","marks":[]}]},{"type":"paragraph","align":"left","children":[{"text":"BOLD","marks":[],"bold":true}]},{"type":"paragraph","align":"left","children":[{"text":"italic","marks":[],"italic":true}]},{"type":"paragraph","align":"left","children":[{"text":"underline","marks":[],"underline":true}]},{"type":"paragraph","align":"left","children":[{"text":"<code>","marks":[],"code":true}]},{"type":"check-list","align":"left","children":[{"text":"Check","marks":[]}]},{"type":"check-list","align":"left","children":[{"marks":[],"text":"List"}],"checked":true},{"type":"block-quote","align":"left","children":[{"text":"Quote","marks":[]}]},{"type":"numbered-list","children":[{"type":"list-item","align":"left","children":[{"marks":[],"text":"list"}]}]},{"type":"bulleted-list","children":[{"type":"list-item","align":"left","children":[{"marks":[],"text":"bullet list"}]}]},{"type":"list-item","align":"left","children":[{"text":"left","marks":[]}]},{"type":"list-item","align":"center","children":[{"marks":[],"text":"center"}]},{"type":"list-item","align":"right","children":[{"marks":[],"text":"right"}]},{"type":"list-item","align":"justify","children":[{"marks":[],"text":"justify"}]},{"type":"list-item","children":[{"marks":[],"text":""}]}
    ],
    []
  );

  useEffect(() => {
    if (recognizedText) {
      let active = isBlockActive(editor, 'list-item', 'type');
      if (active) {
        toggleBlock(editor, 'list-item');
      }
      if (recognizedText) {
        Transforms.insertNodes(editor, Quote(recognizedText));
      } 
      setRecognizedText('');
    }
    else if (image) {
        InsertImage(editor, image);
        setImage(null);
    }
  }, [image, recognizedText, editor]);

  return (
    <Slate
      editor={editor}
      initialValue={initialValue}
      onChange={(value) => {
        let isAstChange = editor.operations.some((op) => 'set_selection' !== op.type);
        if (isAstChange) {
          let content = JSON.stringify(value);
          localStorage.setItem('content', content);
        }
      }}
    >
      <ScreenCapture onCapture={handleTextRecognition} />
      <ScreenCapture onCapture={handleImageCapture} outputType = 'image' />
      <ImageUploadButton />
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
      <div>
        <p>{recognizedText}</p>
      </div>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        spellCheck
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            let currentBlock = Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
            let newLine = {
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
              case 'block-quote':
                e.preventDefault()
                Transforms.insertNodes(editor, newLine);
                break;
              case 'list-item':
              case 'check-list':
                if (currentBlock.children[0].text === '') {
                  e.preventDefault()
                  Transforms.setNodes(editor, newLine);
                  toggleBlock(editor, 'list-item');  
                }
                break;
              case 'image':
                e.preventDefault()
                Transforms.insertNodes(editor, newLine);
                break;
              default:
                return;
            }
          } else if (e.key === 'Backspace'){
            let currentBlock = Node.descendant(editor, editor.selection.anchor.path.slice(0, -1));
            let newLine = {
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
              case 'list-item':
                if (currentBlock.children[0].text === '') {
                  toggleBlock(editor, 'list-item');  
                }
                break;
              case 'block-quote':
                if (currentBlock.children[0].text === '') {
                  Transforms.setNodes(editor, newLine);
                  editor.removeMark('bold');
                  editor.removeMark('italic');
                }
                break;
              default:
                return;
            }
          } else {
            for (let key in HOTKEYS) {
              if (isHotkey(key, e)) {
                e.preventDefault();
                let mark = HOTKEYS[key];
                toggleMark(editor, mark);
              }
            }
          }
        }}
      />
    </Slate>
  );
};

let HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code'
};

let LIST_TYPES = ['numbered-list', 'bulleted-list'];

let Quote = (text) => {
  return (
    {"type":"block-quote",
      "align":"justify",
      "children":[{"text": text,"marks":[],"bold":true,"italic":true}]
    }
  );
};

let Blocks = ({ attributes, children, element }) => {
  let style = { textAlign: 'left'};
  let props = { attributes, children, element }
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
    case 'image':
      return <ImageElement {...props} />
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

let Leaf = ({ attributes, children, leaf }) => {
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

let isBlockActive = (editor, format, blockType = 'type') => {
  let { selection } = editor;
  if (!selection) return false;

  let [match] = Array.from(
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

let isMarkActive = (editor, format) => {
  let marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

let toggleBlock = (editor, format) => {
  let isActive = isBlockActive(
    editor,
    format
  );
  let isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      LIST_TYPES.includes(n.type),
    split: true,
  });

  let newProperties;
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    }
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    let block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

let toggleMark = (editor, format) => {
  let isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

let BlockButton = ({ format }) => {
  let editor = useSlate();
  let isActive = isBlockActive(editor, format, 'type');
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

let MarkButton = ({ format }) => {
  let editor = useSlate();
  let isActive = isMarkActive(editor, format);
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

let renderElement = (props) => {
  return <Blocks {...props} />;
};

let renderLeaf = (props) => {
  return <Leaf {...props} />;
};

let withChecklists = editor => {
  let { deleteBackward } = editor;

  editor.deleteBackward = (...args) => {
    let { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      let [match] = Editor.nodes(editor, {
        match: n =>
          !Editor.isEditor(n) &&
          Element.isElement(n) &&
          (n.type === 'check-list' || n.type === 'list-item')
      });

      if (match) {
        let [, path] = match;
        let start = Editor.start(editor, path);

        if (Point.equals(selection.anchor, start)) {
          let newProperties = {
            type: 'paragraph',
          };
          Transforms.setNodes(editor, newProperties, {
            match: n =>
              !Editor.isEditor(n) &&
              Element.isElement(n) &&
              (n.type === 'check-list' || n.type === 'list-item')
          });
          return;
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
};

let CheckList = ({ attributes, children, element }) => {
  let editor = useSlateStatic();
  let readOnly = useReadOnly();
  let { checked = false } = element; // Default to false if checked is undefined

  return (
    <div
      {...attributes}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'left',
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
            let path = ReactEditor.findPath(editor, element);
            let newProperties = {
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

let withImages = (editor) => {
  let { InsertData, isVoid, deleteBackward, setNodes } = editor;

  editor.isVoid = (element) => {
    return element.type === 'image' ? true : isVoid(element);
  };

  editor.insertData = (data) => {
    let text = data.getData('text/plain');
    let { files } = data;

    if (files && files.length > 0) {
      let reader = new FileReader();
      let [file] = files;

      reader.addEventListener('load', () => {
        let url = reader.result;
        InsertImage(editor, url);
      });

      reader.readAsDataURL(file);
    } else if (IsImageUrl(text)) {
      InsertImage(editor, text);
    } else {
      InsertData(data);
    }
  };

  editor.deleteBackward = (...args) => {
    let { selection } = editor;
    if (selection && Editor.nodes(editor, { match: n => n.type === 'image' }).length) {
      Transforms.removeNodes(editor, { match: n => n.type === 'image' });
      return;
    }
    deleteBackward(...args);
  };

  editor.setNodes = (props) => {
    let { selection } = editor;
    if (selection && Editor.nodes(editor, { match: n => n.type === 'image' }).length) {
        Transforms.setNodes(editor, props, { match: n => n.type === 'image' });
      return;
    }
    setNodes(props);
  };

  editor.insertImageFromCapture = (url) => {
    InsertImage(editor, url);
  };

  return editor;
};


export default Miv;


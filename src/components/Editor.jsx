import { useState } from 'react'
import { Editor, Transforms, Element, createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

const CodeElement = props => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  )
}

const DefaultElement = props => {
  return (
      <p {...props.attributes}>{props.children}</p>
  )
}

const Leaf = props => {
  return (
    <span {...props.attributes} style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}>
      {props.children}
    </span>
    )
}

const CustomEditor = {
  isBoldMarkActive(editor) {
    const marks = Editor.marks(editor)
    return marks ? marks.bold === true : false;
  },
  
  isCodeBlockActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: n => n.type === 'code',
    })

    return !!match
  },

  toggleBoldMark(editor) {
    const isActive = CustomEditor.isBoldMarkActive(editor)
    if (isActive) {
      Editor.removeMark(editor, 'bold')
    } else {
      Editor.addMark(editor, 'bold', true)
    }
  },

  toggleCodeBlock(editor) {
    const isActive = CustomEditor.isCodeBlockActive(editor)

    Transforms.setNodes(
      editor,
      { type: isActive ? null : 'code' },
      { match: n => Element.isElement(n) && Editor.isBlock(editor, n) })   
  }
}

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: 'TEST STRING TEST STRING TEST STRING' }],
  },
  {
    type: 'code',
    children: [{ text: 'CODE BLOCK\nCODE BLOCK\nCODE BLOCK' }],
  },
]

const renderElement = props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />
      default:
        return <DefaultElement {...props} />
    }
} 

const renderLeaf = props => {
  return <Leaf {...props} />
}


const Neditor = () => {
  const [editor] = useState(() => withReact(createEditor()));
  
  return (
    <Slate editor={editor} initialValue={initialValue}>
      <Editable 
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={e => {
          if (!e.ctrlKey) {
            return
          }
          switch (e.key) {
            case '`': {
              e.preventDefault()
              CustomEditor.toggleCodeBlock(editor)
              break;
            }
            case 'b': {
              event.preventDefault()
              CustomEditor.toggleBoldMark(editor)
              break;
            }
          }
        }}
      />
    </Slate>
  )
}

export default Neditor;

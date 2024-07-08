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

              const [match] = Editor.nodes(editor, {
                match: n => n.type === 'code',
              })

              Transforms.setNodes(
                editor,
                { type: match ? 'paragraph' : 'code' },
                { match: n => Element.isElement(n) && Editor.isBlock(editor, n) }
                )
              break;
            }
            case 'b': {
              event.preventDefault()
              let marks = Editor.marks(editor)
              let isBold = marks ? marks.bold === true : false
              if (isBold) {
                Editor.removeMark(editor, 'bold')
              } else {
                Editor.addMark(editor, 'bold', true)
              }
              break;
            }
            case 'i': {
              event.preventDefault()
              console.log(Element)
              Editor.removeMark(editor)
              //Editor.addMark(editor, 'italic', true)
              break;
            }
            case 'u': {
              event.preventDefault()
              Editor.addMark(editor, 'underline', true)
              break;
            }
            case 's': {
              event.preventDefault()
              Editor.addMark(editor, 'strikethrough', true)
              break;
            }
          }
        }}
      />
    </Slate>
  )
}

export default Neditor;

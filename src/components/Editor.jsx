import { useState } from 'react'
import { createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: 'TEST STRING TEST STRING TEST STRING' }],
  },
]

const Editor = () => {
  const [editor] = useState(() => withReact(createEditor()));
  return (
    <Slate editor={editor} initialValue={initialValue}>
      <Editable />
    </Slate>
  )
}

export default Editor;

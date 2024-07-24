import { useRef } from 'react';
import { Transforms } from 'slate';
import { useSlateStatic } from 'slate-react';

let ImageElement = ({ attributes, children, element }) => {
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img src={element.url} alt="Image" />
      </div>
      {children}
    </div>
  );
};

let InsertImage = (editor, url) => {
  let text = { text: '' };
  let image = { type: 'image', url, children: [text] };
  Transforms.insertNodes(editor, image);
};

let IsImageUrl = (url) => {
  if (!url) return false;
  let ext = new URL(url).pathname.split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
};

let ImageUploadButton = () => {
  let editor = useSlateStatic();
  let inputRef = useRef(null);

  let handleButtonClick = () => {
    inputRef.current.click();
  };

  let handleFileChange = (event) => {
    let file = event.target.files[0];
    if (file) {
      let reader = new FileReader();
      reader.addEventListener('load', () => {
        let url = reader.result;
        InsertImage(editor, url);
      });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <button onClick={handleButtonClick}>Upload Image</button>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export { ImageUploadButton, ImageElement, InsertImage, IsImageUrl };

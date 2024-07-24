import React, { useRef } from 'react';
import { Transforms } from 'slate';
import { useSlateStatic } from 'slate-react';

const ImageElement = ({ attributes, children, element }) => {
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img src={element.url} alt="Image" />
      </div>
      {children}
    </div>
  );
};

const insertImage = (editor, url) => {
  const text = { text: '' };
  const image = { type: 'image', url, children: [text] };
  Transforms.insertNodes(editor, image);
};

const isImageUrl = (url) => {
  if (!url) return false;
  const ext = new URL(url).pathname.split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
};

const ImageUploadButton = () => {
  const editor = useSlateStatic();
  const inputRef = useRef(null);

  const handleButtonClick = () => {
    inputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const url = reader.result;
        insertImage(editor, url);
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

export { ImageUploadButton, ImageElement, insertImage, isImageUrl };

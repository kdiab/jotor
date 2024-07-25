import { useRef } from 'react';
import { Transforms } from 'slate';
import { useSlateStatic, useSelected, useFocused } from 'slate-react';
import { css } from '@emotion/css';

const ImageElement = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();

  return (
    <div
      {...attributes}
      className={css`
        position: relative;
        display: block;
        text-align: ${element.align || 'left'};
        ${selected && focused ? 'box-shadow: 0 0 0 3px #B4D5FF;' : ''}
      `}
    >
      <div contentEditable={false}>
        <img
          src={element.url}
          alt="Image"
          className={css`
            display: block;
            max-width: 100%;
            max-height: 20em;
          `}
        />
      </div>
      {children}
    </div>
  );
};

const InsertImage = (editor, url) => {
  const text = { text: '' };
  const image = { type: 'image', url, children: [text] };
  Transforms.insertNodes(editor, image);
};

const IsImageUrl = (url) => {
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


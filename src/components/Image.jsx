import { useRef } from 'react';
import { Transforms } from 'slate';
import { useSlateStatic, useSelected, useFocused } from 'slate-react';
import { css } from '@emotion/css';

let ImageElement = ({ attributes, children, element }) => {
  let selected = useSelected();
  let focused = useFocused();

  return (
    <span
      {...attributes}
      className={css`
        position: relative;
        display: block;
        text-align: left;
        ${selected && focused ? 'box-shadow: 0 0 0 3px #B4D5FF;' : ''}
      `}
    >
      <span contentEditable={false}>
        <img
          src={element.url}
          alt="Image"
          className={css`
            display: block;
            max-width: 100%;
            max-height: 20em;
          `}
        />
      </span>
      {children}
    </span>
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
    <span>
      <button onClick={handleButtonClick}>Upload Image</button>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </span>
  );
};

export { ImageUploadButton, ImageElement, InsertImage, IsImageUrl };


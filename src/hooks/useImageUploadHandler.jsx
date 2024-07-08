import { Editor, Transforms } from "slate";

import axios from "axios";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export default function useImageUploadHandler(editor, selection) {
  return useCallback(
    (event) => {
      event.preventDefault();
      const files = event.target.files;
      if (files.length === 0) {
        return;
      }
      const file = files[0];
      const fileName = file.name;
      const formData = new FormData();
      formData.append("photo", file);

      const id = uuidv4();

      Transforms.insertNodes(
        editor,
        {
          id,
          type: "image",
          caption: fileName,
          url: null,
          isUploading: true,
          children: [{ text: "" }],
        },
        { at: selection, select: true }
      );

      axios
        .post("/upload", formData, {
          headers: {
            "content-type": "multipart/form-data",
          },
        })
        .then((response) => {
          console.log(response);
          setTimeout(() => {
            const newImageEntry = Editor.nodes(editor, {
              match: (n) => n.id === id,
            });

            if (newImageEntry == null) {
              return;
            }

            Transforms.setNodes(
              editor,
              { isUploading: false, url: `/photos/${fileName}` },
              { at: newImageEntry[1] }
            );
          }, 3000);
        })
        .catch((e) => {          
          console.error(e)
        });
    },
    [editor, selection]
  );
}

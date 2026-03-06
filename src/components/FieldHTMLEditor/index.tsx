import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor } from 'tinymce';
import { Flex, Text } from '@chakra-ui/react';
import { HiOutlineInformationCircle } from 'react-icons/hi';

interface TinyMCEEditorProps {
  maxLength: number;
  defaultValue?: string;
  placeHolder?: string;
  onValueChange: (content: string) => void;
}

export const FieldHTMLEditor: React.FC<TinyMCEEditorProps> = ({
  maxLength,
  defaultValue,
  placeHolder = '',
  onValueChange,
}) => {
  const [isMaxLengthReached, setIsMaxLengthReached] = useState(false);
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');

  // Function to get plain text length without HTML tags
  const getTextLength = (html: string): number => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent?.length || 0;
  };

  // Function to truncate HTML content while preserving tags
  const truncateHtml = (html: string, maxLength: number): string => {
    let textLength = 0;
    let result = '';
    let tagStack: string[] = [];
    let inTag = false;
    let tempTag = '';

    for (let i = 0; i < html.length; i++) {
      const char = html[i];

      if (char === '<') {
        inTag = true;
        tempTag = char;
        continue;
      }

      if (inTag) {
        tempTag += char;
        if (char === '>') {
          inTag = false;
          // Handle closing tags
          if (tempTag.startsWith('</')) {
            tagStack.pop();
          } else if (!tempTag.endsWith('/>')) { // Skip self-closing tags
            // Extract tag name from opening tag
            const tagMatch = tempTag.match(/<([^\s>]+)/);
            if (tagMatch) {
              tagStack.push(tagMatch[1]);
            }
          }
          result += tempTag;
        }
        continue;
      }

      if (textLength >= maxLength) {
        continue;
      }

      result += char;
      textLength++;
    }

    // Close any remaining open tags
    while (tagStack.length > 0) {
      result += `</${tagStack.pop()}>`;
    }

    return result;
  };

  const handleEditorChange = (content: string) => {
    const textLength = getTextLength(content);
    
    if (textLength <= maxLength) {
      setHtmlContent(content);
      onValueChange(content);
      setIsMaxLengthReached(false);
      if (textLength === maxLength) {
        setIsMaxLengthReached(true);
      }
    } else {
      const truncatedContent = truncateHtml(content, maxLength);
      setHtmlContent(truncatedContent);
      onValueChange(truncatedContent);
      setIsMaxLengthReached(true);
      
      // Update editor content if ref exists
      if (editorRef.current) {
        editorRef.current.setContent(truncatedContent);
      }
    }
  };

  const handleSetup = (editor: TinyMCEEditor) => {
    editorRef.current = editor;
    
    editor.on('paste', (e) => {
      e.preventDefault();
      console.log('Paste operation is disabled');
    });

    editor.on('keydown', (e) => {
      const content = editor.getContent();
      const textLength = getTextLength(content);
      
      if (textLength >= maxLength) {
        // Allow backspace, delete, arrow keys, etc.
        if (
          e.keyCode === 8 || // backspace
          e.keyCode === 46 || // delete
          (e.keyCode >= 37 && e.keyCode <= 40) || // arrow keys
          e.keyCode === 9 || // tab
          (e.ctrlKey && e.keyCode === 65) || // ctrl+a
          (e.ctrlKey && e.keyCode === 90) || // ctrl+z (undo)
          (e.ctrlKey && e.keyCode === 89) // ctrl+y (redo)
        ) {
          return;
        }
        
        // Prevent typing new characters
        e.preventDefault();
      }
    });
  };

  useEffect(() => {
    if (defaultValue) {
      setHtmlContent(defaultValue);
    }
  }, [defaultValue]);

  return (
    <React.Fragment>
      <Editor
        apiKey="ehs0waurcz4z74lpiutd89dzt0wl6j1jrugjhmntkdy86yo9"
        value={htmlContent}
        init={{
          height: 200,
          menubar: false,
          plugins: [
            'anchor',
            'autolink',
            'charmap',
            'codesample',
            'emoticons',
            'image',
            'link',
            'lists',
            'media',
            'searchreplace',
            'table',
            'visualblocks',
            'wordcount',
          ],
          toolbar:
            'undo redo | bold italic underline backcolor | numlist bullist | removeformat',
          tinycomments_mode: 'embedded',
          content_style:
            'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeHolder,
          setup: handleSetup,
        }}
        onEditorChange={handleEditorChange}
      />
      {isMaxLengthReached && (
        <Flex align="center" fontSize="sm" color="red.500" mt={2}>
          <HiOutlineInformationCircle style={{ marginRight: '4px' }} />
          <Text as="span">
            Character limit of {maxLength} reached
          </Text>
        </Flex>
      )}
    </React.Fragment>
  );
};

export default FieldHTMLEditor;
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Image,
} from '@chakra-ui/react';



interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileType: 'image' | 'pdf' | 'ppt';
  fileUrl: string;
}

export const FilePreview: React.FC<FilePreviewModalProps> = ({
  open,
  onClose,
  fileType,
  fileUrl,
}) => {
  const [zoomed, setZoomed] = useState<boolean>(false);

  const isPdf = fileType === 'pdf';

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size={'6xl'}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered={!isPdf}
    >
      <ModalOverlay />

      <ModalContent
        maxW='75vw'
        maxH='80vh'
        display="flex"
        flexDirection="column"
        borderRadius='md'
      >
        <ModalHeader>File Preview</ModalHeader>
        <ModalCloseButton />

        <ModalBody flex="1" p={4} overflow="auto">
          {/* IMAGE */}
          {fileType === 'image' && (
            <Box
              width="100%"
              height="70vh"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="gray.50"
              borderRadius="md"
              overflow="auto"
            >
              <Image
                src={fileUrl}
                alt="preview"
                maxH="100%"
                maxW="100%"
                objectFit="contain"
                cursor="zoom-in"
                transform={zoomed ? 'scale(1.6)' : 'scale(1)'}
                transition="transform 0.2s ease"
                onClick={() => setZoomed((z) => !z)}
              />
            </Box>
          )}

          {/* PDF / PPT */}
          {(fileType === 'pdf' || fileType === 'ppt') && (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                  fileUrl
                )}&embedded=true`}
                style={{
                  width: '100%',
                  height: '100vh',
                  border: 'none',
                }}
                title="Document Preview"
              />
          )}
        </ModalBody>

        {!isPdf && (
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};


export default FilePreview;

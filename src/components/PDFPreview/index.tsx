import { useEffect, useState } from 'react';

import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';

type PDFPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pdfUrlOrEndpoint: string; // URL or API endpoint
  isEndpoint?: boolean; // true = API endpoint (default), false = direct PDF URL
  title?: string;
};

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrlOrEndpoint,
  isEndpoint = true,
  title = 'PDF Preview',
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && isEndpoint) {
      const fetchPdf = async () => {
        setLoading(true);
        try {
          if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null); // Clear before reusing
          }

          const response = await axios.get(pdfUrlOrEndpoint, {
            responseType: 'arraybuffer',
            headers: { Accept: 'application/pdf' },
          });

          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        } catch (err) {
          console.error('PDF fetch failed:', err);
          setPdfBlobUrl(null); // Ensure reset on failure
        } finally {
          setLoading(false);
        }
      };

      fetchPdf();
    } else if (!isEndpoint) {
      setPdfBlobUrl(pdfUrlOrEndpoint); // Direct link
    }
  }, [isOpen, pdfUrlOrEndpoint, isEndpoint]);

  const handleClose = () => {
    onClose();
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(null);
  };

  useEffect(() => {
    return () => {
      if (pdfBlobUrl && isEndpoint) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    };
  }, [pdfBlobUrl, isEndpoint]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="xl"
      closeOnOverlayClick={false}
      motionPreset="none"
    >
      <ModalOverlay />
      <ModalContent
        maxW="900px"
        w="90vw"
        h="90vh"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader textAlign="center">{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody
          flex="1"
          p={0}
          overflow="hidden"
          display="flex"
          justifyContent="center"
          bg="gray.50"
          position="relative"
        >
          <Box w="100%" h="100%" bg="white" position="relative" boxShadow="md">
            {loading ? (
              <Flex
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                justify="center"
                align="center"
                bg="white"
                zIndex={1}
              >
                <Spinner size="xl" />
              </Flex>
            ) : pdfBlobUrl ? (
              <iframe
                key={pdfBlobUrl}
                src={`${pdfBlobUrl}#zoom=80&toolbar=0&navpanes=0&scrollbar=0`}
                width="100%"
                height="100%"
                title="PDF Preview"
                style={{ border: 'none', display: 'block' }}
              />
            ) : (
              <Flex
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                justify="center"
                align="center"
                bg="white"
                zIndex={1}
              >
                <Text p={4}>Unable to load PDF</Text>
              </Flex>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PDFPreviewModal;

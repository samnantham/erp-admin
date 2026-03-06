import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonProps } from '@chakra-ui/react';
import { HiDocumentDownload, HiEye } from 'react-icons/hi';
import { FilePreview } from '@/components/FilePreview';

interface DocumentDownloadButtonProps extends ButtonProps {
  url: string | null;
}

const DocumentDownloadButton: React.FC<DocumentDownloadButtonProps> = ({
  url,
  ...buttonProps
}) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'ppt'>('image');
  const [fileUrl, setFileUrl] = useState<string>('');

  const completeUrl = url
    ? `${import.meta.env.VITE_PUBLIC_DOC_URL}${url}`
    : '#';

  const closeModal = () => {
    setFileUrl('');
    setOpenModal(false);
  };

  const clickView = (docUrl: string | null) => {
    if (!docUrl) return;
    
    const fileExtension = docUrl.split('.').pop()?.toLowerCase();
    if (!fileExtension) return;

    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      setFileType('image');
    } else if (fileExtension === 'pdf') {
      setFileType('pdf');
    } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
      setFileType('ppt');
    }
    setFileUrl(completeUrl);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    
    if (!url) return;

    try {
      // First try the direct download approach
      const a = document.createElement('a');
      a.href = completeUrl;
      a.download = url.split('/').pop() || 'document';
      a.target = '_blank'; // Open in new tab if download attribute not supported
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Fallback to fetch if direct approach fails
      setTimeout(async () => {
        try {
          const response = await fetch(completeUrl, {
            mode: 'cors',
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to fetch');
          
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const fallbackA = document.createElement('a');
          fallbackA.href = downloadUrl;
          fallbackA.download = url.split('/').pop() || 'document';
          document.body.appendChild(fallbackA);
          fallbackA.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(fallbackA);
        } catch (error) {
          console.error('Download failed:', error);
          // Final fallback - open in new tab
          window.open(completeUrl, '_blank');
        }
      }, 200);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(completeUrl, '_blank');
    }
  };

  useEffect(() => {
    if (fileUrl) {
      setOpenModal(true);
    }
  }, [fileUrl]);

  return (
    <Box display="flex" gap={2}>
      <Button
        borderRadius="md"
        bg="gray.50"
        border="1px solid"
        borderColor="gray.200"
        leftIcon={<HiEye />}
        isDisabled={!url}
        onClick={() => clickView(url)}
        {...buttonProps}
      >
        View
      </Button>
      
      <Button
        borderRadius="md"
        bg="gray.50"
        border="1px solid"
        borderColor="gray.200"
        leftIcon={<HiDocumentDownload />}
        isDisabled={!url}
        onClick={handleDownload}
        {...buttonProps}
      >
        Download
      </Button>

      <FilePreview
        open={openModal}
        onClose={closeModal}
        fileType={fileType}
        fileUrl={fileUrl}
      />
    </Box>
  );
};

export default DocumentDownloadButton;
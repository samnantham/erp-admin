import React, { useEffect, useRef, useState } from 'react';

import {
  Box,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
  Progress,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { HiEye, HiOutlineUpload, HiX } from 'react-icons/hi';

import { FilePreview } from '@/components/FilePreview';
import { useFileUpload } from '@/services/global-service';

interface PairDocUploadProps {
  existingUrl?: string;                          // pre-fill with saved URL
  onValueChange?: (value: string | null) => void; // fires on upload / delete
  isDisabled?: boolean;
}

export const PairDocUpload = ({
  existingUrl,
  onValueChange,
  isDisabled = false,
}: PairDocUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedPath, setUploadedPath] = useState<string>(existingUrl ?? '');
  const [fileName, setFileName]         = useState<string>(
    existingUrl ? existingUrl.split('/').pop() ?? existingUrl : ''
  );
  const [uploading, setUploading]       = useState(false);
  const [uploadComplete, setUploadComplete] = useState(!!existingUrl);

  // Preview modal
  const [openModal, setOpenModal]   = useState(false);
  const [fileUrl, setFileUrl]       = useState('');
  const [fileType, setFileType]     = useState<'image' | 'pdf' | 'ppt'>('image');

  // Sync if parent changes existingUrl (e.g. edit mode opens with a saved URL)
  useEffect(() => {
    if (existingUrl) {
      setUploadedPath(existingUrl);
      setFileName(existingUrl.split('/').pop() ?? existingUrl);
      setUploadComplete(true);
    } else {
      setUploadedPath('');
      setFileName('');
      setUploadComplete(false);
    }
  }, [existingUrl]);

  const uploadFile = useFileUpload({
    onSuccess: ({ data }) => {
      setUploading(false);
      setUploadComplete(true);
      setUploadedPath(data.file_path);
      setFileName(data.file_path.split('/').pop() ?? data.file_path);
      onValueChange?.(data.file_path);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setUploadComplete(false);
    const formData = new FormData();
    formData.append('file', file);
    uploadFile.mutate(formData);
    e.target.value = '';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadComplete && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedPath('');
    setFileName('');
    setUploadComplete(false);
    onValueChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!uploadedPath) return;
    const ext = uploadedPath.split('.').pop()?.toLowerCase() ?? '';
    const url = `${import.meta.env.VITE_PUBLIC_DOC_URL}${uploadedPath}`;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) setFileType('image');
    else if (ext === 'pdf') setFileType('pdf');
    else setFileType('ppt');
    setFileUrl(url);
    setOpenModal(true);
  };

  return (
    <Box>
      <InputGroup size="sm">
        <Input
          readOnly
          value={fileName}
          placeholder="Upload document (optional)"
          onClick={handleClick}
          cursor={isDisabled || uploadComplete ? 'default' : 'pointer'}
          isDisabled={isDisabled}
        />
        <InputRightAddon
          w="80px"
          bg={uploading || uploadComplete ? 'gray.300' : 'brand.900'}
          color="white"
          borderRightRadius="md"
          cursor={isDisabled || uploading ? 'not-allowed' : 'pointer'}
          opacity={isDisabled || uploading ? 0.7 : 1}
          pointerEvents={isDisabled || uploading ? 'none' : 'auto'}
          onClick={handleClick}
        >
          <Tooltip
            hasArrow
            label={uploadComplete ? 'Delete file to re-upload' : ''}
            placement="top"
            isDisabled={!uploadComplete}
          >
            <HStack spacing={1} justify="center" w="100%">
              <HiOutlineUpload />
              <Text fontSize="xs" fontWeight="thin">Upload</Text>
            </HStack>
          </Tooltip>
        </InputRightAddon>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          disabled={isDisabled}
          onChange={handleFileChange}
        />
      </InputGroup>

      {uploading && <Progress size="xs" isIndeterminate mt={1} />}

      {uploadComplete && !uploading && fileName && (
        <HStack mt={1} spacing={2} justify="space-between">
          <Text fontSize="xs" color="green.500" isTruncated maxW="70%">
            📎 {fileName}
          </Text>
          <HStack spacing={1}>
            <IconButton
              aria-label="Preview document"
              icon={<HiEye />}
              size="xs"
              colorScheme="blue"
              variant="ghost"
              onClick={handleView}
            />
            {!isDisabled && (
              <IconButton
                aria-label="Remove document"
                icon={<HiX />}
                size="xs"
                colorScheme="red"
                variant="ghost"
                onClick={handleDelete}
              />
            )}
          </HStack>
        </HStack>
      )}

      <FilePreview
        open={openModal}
        onClose={() => { setOpenModal(false); setFileUrl(''); }}
        fileType={fileType}
        fileUrl={fileUrl}
      />
    </Box>
  );
};
import { Box, Flex, Image, Text } from '@chakra-ui/react';
import { format } from 'date-fns';

type FieldDisplayProps = {
  style?: any;
  createdBy?: string;
  createdAt?: string;
  totalPages?: number;
  currentPage?: number;
};

export const PDFPreviewFooter = ({
  style = {},
  createdBy = '',
  createdAt = '',
  totalPages = 1,
  currentPage = 1,
}: FieldDisplayProps) => {
  return (
    <Box style={style} id={'pdfFooter'}>
      <Flex mb={1} justify="space-between">
        <Box>
          <Flex direction="column" gap={1}>
            <Flex justify="space-between">
              <Image
                src="/ASA.jpg"
                alt="Logo"
                width="100px"
                height={12}
                w={'auto'}
              />
            </Flex>
          </Flex>
        </Box>
        <Box
          display="flex"
          flexDirection="column" // Arrange children in a column
          justifyContent="flex-end"
        >
          <Flex direction="column" gap={1}>
            <Flex justify="space-between">
              <Text> Issue : 2</Text>
            </Flex>
          </Flex>
        </Box>
        <Box
          display="flex"
          flexDirection="column" // Arrange children in a column
          justifyContent="flex-end"
        >
          <Flex direction="column" gap={1}>
            <Flex justify="space-between">
              <Text> Revision : 0.0 </Text>
            </Flex>
          </Flex>
        </Box>
        <Box
          display="flex"
          flexDirection="column" // Arrange children in a column
          justifyContent="flex-end"
        >
          <Flex direction="column" gap={1}>
            <Flex justify="space-between">
              <Text> MAR'2023 QSP-Form 4 </Text>
            </Flex>
          </Flex>
        </Box>
        <Box>
          <Flex direction="column" gap={1}>
            <Flex justify="space-between">
              <Image
                src="/ISO.jpg"
                alt="Logo"
                width="100px"
                height={12}
                w={'auto'}
              />
            </Flex>
          </Flex>
        </Box>
      </Flex>
      <Box borderBottom="1px solid black" mb={1} />
      <Flex justify="space-between" align="center">
        <Box>
          <Flex direction="column" gap={1}>
            <Flex justify="space-between">
              <Text marginEnd={2} sx={{ fontWeight: 'bold' }}>
                Printed At:
              </Text>
              <Text textAlign="left">
                {format(new Date(), 'dd/MM/yyyy HH:mm a')}
              </Text>
            </Flex>
          </Flex>
        </Box>

        <Box>
          <Flex direction="column" gap={1}>
            {createdBy && (
              <Flex justify="space-between">
                <Text marginEnd={2} sx={{ fontWeight: 'bold' }}>
                  User Created:
                </Text>
                <Text textAlign="left">{createdBy}</Text>
              </Flex>
            )}
          </Flex>
        </Box>

        <Box>
          <Flex direction="column" gap={1}>
            {createdAt && (
              <Flex justify="space-between">
                <Text marginEnd={2} sx={{ fontWeight: 'bold' }}>
                  Created Date:
                </Text>
                <Text textAlign="left">
                  {format(new Date(createdAt), 'dd/MM/yyyy HH:mm a')}
                </Text>
              </Flex>
            )}
          </Flex>
        </Box>

        <Box>
          <Flex direction="column" gap={1}>
            <Flex justify="space-between">
              <Text marginEnd={2} sx={{ fontWeight: 'bold' }}>
                Page:
              </Text>
              <Text textAlign="left">
                {currentPage} of {totalPages}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default PDFPreviewFooter;

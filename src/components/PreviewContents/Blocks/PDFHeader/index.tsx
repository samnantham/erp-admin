import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';

type FieldDisplayProps = {
  style?: any;
};

const PDFHeader = ({ style = {} }: FieldDisplayProps) => {
  return (
    <Flex justify="space-between" mb={4} style={style} id={'pdfHeader'}>
      <Box flex="1">
        <Image
          src="/logo.png"
          alt="Logo"
          width="100px"
          height={24}
          w={'auto'}
        />
      </Box>
      <Box flex="1"></Box>
      <Box flex="1">
        <Flex alignItems="baseline" lineHeight="1.2">
          <Text
            fontWeight="bold"
            minWidth="60px"
            textAlign="left"
          >
            &nbsp;&nbsp;PO Box
          </Text>
          <Text mr={1} fontWeight="bold" as="span" textAlign="right">
            :&nbsp;&nbsp;
          </Text>
          <Text alignSelf="baseline">
            122215, P3-06
          </Text>
        </Flex>
        <Flex alignItems="baseline" lineHeight="1.2">
          <Text
            fontWeight="bold"
            minWidth="60px"
            textAlign="left"
          >
            &nbsp;&nbsp;Address
          </Text>
          <Text mr={1} fontWeight="bold" as="span" textAlign="right">
            :&nbsp;&nbsp;
          </Text>
          <Text alignSelf="baseline">
            SAIF Zone <br />
            Sharjah &nbsp;, UAE
          </Text>
        </Flex>
        <Flex alignItems="baseline" lineHeight="1.2">
          <Text
            fontWeight="bold"
            minWidth="60px"
            textAlign="left"
          >
            &nbsp;&nbsp;Tel
          </Text>
          <Text mr={1} fontWeight="bold" as="span" textAlign="right">
            :&nbsp;&nbsp;
          </Text>
          <Text alignSelf="baseline">
            <Link
              href="tel:+97165528341"
              isExternal
              textDecoration="none"
              _hover={{ color: 'blue.500', textDecoration: 'none' }}
            >
              +971 6 552 8341
            </Link>
          </Text>
        </Flex>
        <Flex alignItems="baseline" lineHeight="1.2">
          <Text
            fontWeight="bold"
            minWidth="60px"
            textAlign="left"
          >
            &nbsp;&nbsp;Email
          </Text>
          <Text mr={1} fontWeight="bold" as="span" textAlign="right">
            :&nbsp;&nbsp;
          </Text>
          <Text alignSelf="baseline">
            <Link
              href="mailto:info@yestechnik.com"
              isExternal
              textDecoration="none"
              _hover={{ color: 'blue.500', textDecoration: 'none' }}
            >
              info@yestechnik.com
            </Link>
          </Text>
        </Flex>
        <Flex alignItems="baseline" lineHeight="1.2">
          <Text
            fontWeight="bold"
            minWidth="60px"
            textAlign="left"
          >
            &nbsp;&nbsp;Website
          </Text>
          <Text mr={1} fontWeight="bold" as="span" textAlign="right">
            :&nbsp;&nbsp;
          </Text>
          <Text alignSelf="baseline">
            <Link
              href="https://www.yestechnik.com"
              isExternal
              textDecoration="none"
              _hover={{ color: 'blue.500', textDecoration: 'none' }}
            >
              www.yestechnik.com
            </Link>
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
};

export default PDFHeader;

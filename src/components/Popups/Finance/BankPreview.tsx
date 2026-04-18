import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Divider,
  Badge,
  Flex,
} from "@chakra-ui/react";

/* =========================================================
   Types
========================================================= */
export interface BankData {
  name?: string;
  branch?: string;
  currency?: { code?: string; name?: string };
  ac_iban_no?: string;
  account_label?: string;
  type_of_ac?: string;
  swift?: string;
  ifsc_code?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  is_active?: boolean;
  is_default?: boolean;
}

/* =========================================================
   Icons (inline SVG)
========================================================= */
const PersonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="1" width="8" height="14" rx="2" />
    <circle cx="8" cy="12" r="0.75" fill="currentColor" />
  </svg>
);

const EmailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="14" height="9" rx="1.5" />
    <path d="M1 6l7 4.5L15 6" />
  </svg>
);

/* =========================================================
   Sub-components
========================================================= */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    fontSize="10px"
    fontWeight="600"
    letterSpacing="1.2px"
    color="gray.400"
    textTransform="uppercase"
    mb={3}
  >
    {children}
  </Text>
);

const Row = ({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  badge?: "blue" | "green" | "purple";
}) => {
  const badgeSchemeMap = { blue: "blue", green: "green", purple: "purple" };
  return (
    <HStack justify="space-between" py="5px">
      <Text fontSize="12px" color="gray.500">
        {label}
      </Text>
      {badge ? (
        <Badge
          colorScheme={badgeSchemeMap[badge]}
          borderRadius="full"
          px={2}
          fontSize="11px"
        >
          {value || "N/A"}
        </Badge>
      ) : (
        <Text
          fontSize="12px"
          fontWeight="500"
          fontFamily={mono ? "mono" : "body"}
          color="gray.700"
        >
          {value || "—"}
        </Text>
      )}
    </HStack>
  );
};

const ContactRow = ({
  icon,
  name,
  sub,
}: {
  icon: React.ReactNode;
  name?: string | null;
  sub: string;
}) => (
  <HStack spacing={3} py="5px" align="center">
    <Flex
      w="28px"
      h="28px"
      borderRadius="full"
      bg="gray.100"
      align="center"
      justify="center"
      flexShrink={0}
      color="gray.500"
    >
      {icon}
    </Flex>
    <Box flex={1}>
      <Text fontSize="12px" fontWeight="500" color="gray.700" lineHeight="1.3">
        {name || "—"}
      </Text>
      <Text fontSize="11px" color="gray.400" lineHeight="1.3">
        {sub}
      </Text>
    </Box>
  </HStack>
);

/* =========================================================
   Main Component
========================================================= */
type Props = {
  data: BankData;
};

export const BankPreview: React.FC<Props> = ({ data }) => {
  const maskAccount = (val?: string) =>
    val ? `•••• •••• •••• ${val.slice(-4)}` : "•••• •••• •••• ────";

  return (
    <Box w="400px" fontFamily="body">
      {/* ── Header ── */}
      <Box
        bg="#0f2027"
        borderRadius="16px 16px 0 0"
        p={6}
        position="relative"
        overflow="hidden"
      >
        {/* Decorative circles */}
        <Box
          position="absolute"
          top="-40px"
          right="-40px"
          w="160px"
          h="160px"
          borderRadius="full"
          bg="whiteAlpha.50"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-30px"
          left="60px"
          w="100px"
          h="100px"
          borderRadius="full"
          bg="whiteAlpha.50"
          pointerEvents="none"
        />

        <Flex justify="space-between" align="flex-start" position="relative">
          <Box>
            <Text
              fontSize="17px"
              fontWeight="500"
              color="white"
              letterSpacing="0.3px"
              mb="2px"
            >
              {data.name || "Bank"}
            </Text>
            <Text fontSize="12px" color="whiteAlpha.500">
              {data.branch || "—"}
            </Text>
          </Box>
          <Badge
            bg="whiteAlpha.100"
            color="whiteAlpha.800"
            border="0.5px solid"
            borderColor="whiteAlpha.200"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="11px"
            fontWeight="400"
          >
            {data.currency?.code ?? "—"} · {data.currency?.name ?? "—"}
          </Badge>
        </Flex>

        {/* Chip */}
        <Box
          w="32px"
          h="24px"
          my={5}
          borderRadius="5px"
          bgGradient="linear(135deg, #d4a843, #f0cc70, #b8891a)"
          position="relative"
        />

        <Flex justify="space-between" align="flex-end" position="relative">
          <Text
            fontFamily="mono"
            fontSize="13px"
            color="whiteAlpha.700"
            letterSpacing="3px"
          >
            {maskAccount(data.ac_iban_no)}
          </Text>
          <Text fontSize="11px" color="whiteAlpha.400">
            {data.type_of_ac?.toUpperCase() ?? ""}
          </Text>
        </Flex>
      </Box>

      {/* ── Body ── */}
      <Box
        bg="white"
        border="0.5px solid"
        borderColor="gray.200"
        borderTop="none"
        borderRadius="0 0 16px 16px"
      >
        {/* Account Details */}
        <Box px={5} py={4}>
          <SectionLabel>Account details</SectionLabel>
          <VStack spacing={0} align="stretch">
            <Row label="Account label" value={data.account_label} />
            <Row label="Account type" value={data.type_of_ac} badge="blue" />
            <Row label="SWIFT" value={data.swift} mono />
            <Row label="IFSC" value={data.ifsc_code} mono />
          </VStack>
        </Box>

        <Divider borderColor="gray.100" />

        {/* Contact */}
        <Box px={5} py={4}>
          <SectionLabel>Contact</SectionLabel>
          <VStack spacing={0} align="stretch">
            <ContactRow icon={<PersonIcon />} name={data.contact_name} sub="Account holder" />
            <ContactRow icon={<PhoneIcon />} name={data.phone} sub="Mobile" />
            <ContactRow icon={<EmailIcon />} name={data.email} sub="Email" />
          </VStack>
        </Box>

        <Divider borderColor="gray.100" />

        {/* Address */}
        <Box px={5} py={4}>
          <SectionLabel>Address</SectionLabel>
          <Box
            bg="gray.50"
            borderRadius="md"
            p={3}
            fontSize="12px"
            color="gray.600"
            lineHeight="1.6"
          >
            {data.address_line1 || "No address provided"}
          </Box>
        </Box>

        {/* Footer */}
        <Flex
          justify="space-between"
          align="center"
          px={5}
          py={3}
          borderTop="0.5px solid"
          borderColor="gray.100"
        >
          <HStack spacing={2}>
            <Box
              w="7px"
              h="7px"
              borderRadius="full"
              bg={data.is_active ? "green.400" : "red.400"}
            />
            <Text fontSize="12px" color="gray.500">
              {data.is_active ? "Active account" : "Inactive"}
            </Text>
          </HStack>
          <HStack spacing={3}>
            {data.is_default && (
              <>
                <Box w="0.5px" h="14px" bg="gray.200" />
                <Badge
                  colorScheme="purple"
                  borderRadius="full"
                  px={2}
                  fontSize="11px"
                >
                  Default
                </Badge>
              </>
            )}
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
};

export default BankPreview;
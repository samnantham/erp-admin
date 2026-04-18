import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

/* =========================================================
   Types
========================================================= */
export interface ChequeData {
  name?: string;
  branch?: string;
  currency?: { code?: string; name?: string };
  ac_no?: string;
  contact_name?: string;
  type_of_ac?: string;
  ifsc_code?: string;
  aba_routing_no?: string;
  micr_code?: string;
  address_line1?: string;
  is_active?: boolean;
  is_default?: boolean;
}

/* =========================================================
   ChequePreview
========================================================= */
type Props = {
  data: ChequeData;
};

export const ChequePreview: React.FC<Props> = ({ data }) => {
  const maskAccount = (val?: string) =>
    val ? `•••• •••• ${val.slice(-4)}` : "•••• ••••";

  return (
    <Box
      w="520px"
      fontFamily="'Courier Prime', 'Courier New', monospace"
      bg="#fdf8f0"
      border="1px solid #c9b99a"
      borderRadius="4px"
      position="relative"
      overflow="hidden"
      /* subtle grid watermark */
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(180,160,120,0.07) 24px, rgba(180,160,120,0.07) 25px),
          repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(180,160,120,0.07) 24px, rgba(180,160,120,0.07) 25px)
        `,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* SPECIMEN watermark */}
      <Text
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%) rotate(-30deg)"
        fontSize="52px"
        color="rgba(44,95,74,0.04)"
        fontFamily="Georgia, serif"
        letterSpacing="6px"
        pointerEvents="none"
        whiteSpace="nowrap"
        zIndex={0}
        userSelect="none"
      >
        SPECIMEN
      </Text>

      {/* ── Top colour strip ── */}
      <Box
        h="6px"
        bgImage="repeating-linear-gradient(90deg, #2c5f4a 0px, #2c5f4a 8px, #1a3d30 8px, #1a3d30 16px, #d4a843 16px, #d4a843 20px, #2c5f4a 20px)"
        position="relative"
        zIndex={1}
      />

      {/* ── Header ── */}
      <Flex
        justify="space-between"
        align="flex-start"
        px={5}
        pt="14px"
        pb="10px"
        borderBottom="0.5px solid #c9b99a"
        position="relative"
        zIndex={1}
      >
        <Box>
          <Text
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="16px"
            fontWeight="500"
            color="#1a3d30"
            letterSpacing="0.5px"
            m={0}
          >
            {data.contact_name || "Bank"}
          </Text>
          <Text fontSize="10px" color="#7a6a50" letterSpacing="0.3px" mt="2px">
            {data.branch || "—"}
          </Text>
          <Text fontSize="10px" color="#9a8a70" mt="1px">
            {data.currency?.code} · {data.currency?.name}
          </Text>
        </Box>
        <Box textAlign="right">
          <Text fontSize="9px" color="#9a8a70" letterSpacing="1px" textTransform="uppercase">
            Cheque No.
          </Text>
          <Text fontSize="13px" color="#2c5f4a" fontWeight="700" letterSpacing="2px">
            000001
          </Text>
        </Box>
      </Flex>

      {/* ── Body ── */}
      <Box px={5} py={4} position="relative" zIndex={1}>

        {/* Date row */}
        <Flex justify="flex-end" align="center" gap={2} mb={4}>
          <Text fontSize="9px" color="#9a8a70" letterSpacing="0.8px" textTransform="uppercase">
            Date
          </Text>
          <Flex gap="3px" align="center">
            {["D", "D"].map((d, i) => <DateBox key={i} label={d} />)}
            <Text fontSize="11px" color="#9a8a70">/</Text>
            {["M", "M"].map((d, i) => <DateBox key={i} label={d} />)}
            <Text fontSize="11px" color="#9a8a70">/</Text>
            {["Y", "Y", "Y", "Y"].map((d, i) => <DateBox key={i} label={d} />)}
          </Flex>
        </Flex>

        {/* Pay to */}
        <Flex align="flex-end" gap={2} mb="10px">
          <Text fontSize="10px" color="#5a4a30" fontWeight="700" letterSpacing="0.5px" whiteSpace="nowrap">
            Pay to
          </Text>
          <Box flex={1} borderBottom="1px solid #8a7a60" pb="2px">
            <Text
              fontFamily="Georgia, serif"
              fontSize="14px"
              color="#1a1208"
            >
              {"——————————————————"}
            </Text>
          </Box>
          <Text fontSize="10px" color="#5a4a30" fontWeight="700" letterSpacing="0.5px" whiteSpace="nowrap">
            or bearer
          </Text>
        </Flex>

        {/* Amount */}
        <Flex align="flex-end" gap={2} mb="10px">
          <Box
            border="1px solid #8a7a60"
            px={3}
            py="4px"
            bg="rgba(255,255,255,0.6)"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Text fontSize="14px" color="#5a4a30" fontWeight="700">₹</Text>
            <Text fontSize="16px" color="#1a1208" fontWeight="700" letterSpacing="1px" minW="80px">
              __________
            </Text>
          </Box>
        </Flex>

        {/* Rupees in words */}
        <Flex align="flex-end" gap={2} mb={4}>
          <Text fontSize="10px" color="#5a4a30" fontWeight="700" whiteSpace="nowrap">
            Rupees
          </Text>
          <Box flex={1} borderBottom="1px solid #8a7a60" pb="2px">
            <Text fontSize="11px" color="#3a2e1e" fontStyle="italic">
              _________________________________________________________________ only
            </Text>
          </Box>
        </Flex>

        {/* Account box */}
        <Flex
          justify="space-between"
          align="center"
          border="0.5px solid #b9a98a"
          px={3}
          py="6px"
          bg="rgba(255,255,255,0.5)"
          mb={4}
        >
          <Box>
            <Text fontSize="9px" color="#9a8a70" letterSpacing="0.8px" textTransform="uppercase">
              Account
            </Text>
            <Text fontSize="14px" color="#1a3d30" fontWeight="700" letterSpacing="3px">
              {maskAccount(data.ac_no)}
            </Text>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
            <Box
              fontSize="9px"
              color="#2c5f4a"
              bg="rgba(44,95,74,0.1)"
              border="0.5px solid rgba(44,95,74,0.3)"
              px="7px"
              py="2px"
              borderRadius="2px"
              letterSpacing="0.5px"
            >
              {data.type_of_ac?.toUpperCase() || "SAVINGS"}
            </Box>
            <Text fontSize="10px" color="#9a8a70">
              IFSC: {data.ifsc_code || "—"}
            </Text>
          </Box>
        </Flex>

        {/* Details grid */}
        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr"
          gap={2}
          mb={4}
        >
          <DetailItem label="MICR Code" value={data.micr_code} />
          <DetailItem label="ABA / Routing" value={data.aba_routing_no} />
          <DetailItem label="Address" value={data.address_line1} small />
          <DetailItem label="Currency" value={data.currency?.code} />
        </Box>

        {/* Signature */}
        <Flex justify="flex-end" mb={2}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <Box w="160px" borderBottom="1px solid #3a2e1e" />
            <Text fontSize="9px" color="#9a8a70" letterSpacing="0.8px" textTransform="uppercase">
              Authorized Signature
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* ── MICR footer ── */}
      <Flex
        justify="space-between"
        align="center"
        bg="#1a3d30"
        px={5}
        py={2}
        position="relative"
        zIndex={1}
      >
        <Text
          fontFamily="'Courier Prime', 'Courier New', monospace"
          fontSize="12px"
          color="rgba(255,255,255,0.85)"
          letterSpacing="4px"
        >
          ⑆ 000001 ⑆ {data.micr_code || "000000000"} ⑆ {data.ac_no?.slice(-4) || "0000"} ⑆
        </Text>
        <Flex gap={2} align="center">
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg={data.is_active ? "#5DCAA5" : "#F09595"}
          />
          <Text fontSize="10px" color="rgba(255,255,255,0.7)">
            {data.is_active ? "Active" : "Inactive"}
          </Text>
          {data.is_default && (
            <Box
              fontSize="9px"
              color="#d4a843"
              bg="rgba(212,168,67,0.25)"
              border="0.5px solid rgba(212,168,67,0.4)"
              px="7px"
              py="2px"
              borderRadius="2px"
              letterSpacing="0.5px"
            >
              Default
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

/* =========================================================
   Sub-components
========================================================= */
const DateBox = ({ label }: { label: string }) => (
  <Box
    w="22px"
    h="22px"
    border="0.5px solid #b9a98a"
    display="flex"
    alignItems="center"
    justifyContent="center"
    fontSize="11px"
    color="#3a2e1e"
    bg="rgba(255,255,255,0.5)"
  >
    {label}
  </Box>
);

const DetailItem = ({
  label,
  value,
  small,
}: {
  label: string;
  value?: string | null;
  small?: boolean;
}) => (
  <Box display="flex" flexDirection="column" gap="2px">
    <Text fontSize="9px" color="#9a8a70" letterSpacing="0.8px" textTransform="uppercase">
      {label}
    </Text>
    <Text
      fontSize={small ? "10px" : "11px"}
      color={small ? "#5a4a30" : "#1a1208"}
      fontWeight={small ? "400" : "700"}
      letterSpacing="0.5px"
      fontFamily="'Courier Prime', 'Courier New', monospace"
    >
      {value || "—"}
    </Text>
  </Box>
);

export default ChequePreview;
import React, { useEffect, useState, useMemo } from 'react';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { ChevronRightIcon } from '@chakra-ui/icons';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Button,
    Checkbox,
    Divider,
    Flex,
    HStack,
    Heading,
    Icon,
    Stack,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import { BsPatchCheckFill } from "react-icons/bs";
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import {
    HiArrowNarrowLeft,
    HiOutlineBadgeCheck,
    HiOutlineShieldCheck,
    HiOutlineTag,
    HiOutlineTruck
} from 'react-icons/hi';
import { TbLayoutSidebarLeftCollapseFilled, TbLayoutSidebarRightCollapseFilled } from "react-icons/tb";
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmationPopup from '@/components/ConfirmationPopup';
import { SlideIn } from '@/components/SlideIn';
import { usePRFQDetails } from '@/services/purchase/rfq/service';
import { useQuotationsByRFQ } from '@/services/purchase/quotation/service';
import LoadingOverlay from '@/components/LoadingOverlay';

/* ─── Stat card used in the summary dashboard ─── */
const SummaryCard = ({
    icon,
    label,
    value,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    accent: string;
}) => {
    const bg = useColorModeValue('#0C2556', 'white');
    const border = useColorModeValue('gray.100', 'gray.700');
    return (
        <Box
            bg={bg}
            border="3px solid"
            borderColor={border}
            borderRadius="xl"
            p={4}
            flex="1"
            minW="160px"
            position="relative"
            overflow="hidden"
            _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '10px',
                height: '100%',
                bg: accent,
                borderRadius: 'xl 0 0 xl',
            }}
        >
            <HStack spacing={3} mb={2}>
                <Box p={2} paddingLeft={0} paddingRight={0} bg={accent + '15'} borderRadius="lg">
                    <Icon as={icon} boxSize={4} color={'#fff'} />
                </Box>
                <Text fontSize="xs" fontWeight="600" color="#fff" textTransform="uppercase" letterSpacing="wider">
                    {label}
                </Text>
            </HStack>
            <Text fontSize="sm" fontWeight="700" color="#fff" noOfLines={1}>
                {value || 'N/A'}
            </Text>
        </Box>
    );
};

/* ─── Inline price chip with optional "best" highlight ─── */
const PriceChip = ({
    price,
    isBest,
    isExactMatch,
    currency,
}: {
    price: number;
    isBest: boolean;
    isExactMatch: boolean;
    currency?: string;
}) => (
    <HStack spacing={1}>
        <Text fontWeight={isBest ? '700' : '500'} fontSize="sm">
            {currency ? `${currency} ` : ''}{Number(price || 0).toFixed(2)}
        </Text>
        {isBest && (
            <BsPatchCheckFill
                color={isExactMatch ? 'green' : 'orange'}
                size={20}
                title={isExactMatch ? 'Best Price (Exact Match)' : 'Best Price (Alt Part)'}
            />
        )}
    </HStack>
);

/* ─── Redesigned left sidebar vendor item ─── */
// FIX 1: Added isExactMatch to props type and destructuring
const SidebarVendorItem = ({
    quote,
    isBest,
    isExactMatch,
    isSelected,
    isDisabled,
    onToggle,
}: {
    quote: any;
    isBest: boolean;
    isExactMatch: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    onToggle: () => void;
}) => {
    const selectedBg = useColorModeValue('blue.50', 'blue.900');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');
    const borderColor = useColorModeValue('gray.100', 'gray.700');
    const namePrimary = useColorModeValue('gray.800', 'gray.100');
    const nameSelected = useColorModeValue('blue.700', 'blue.200');
    const priceColor = useColorModeValue('gray.600', 'gray.400');
    const priceSelected = useColorModeValue('blue.600', 'blue.300');
    const subTextColor = useColorModeValue('gray.400', 'gray.500');
    return (
        <Box
            px={4}
            py={2.5}
            display="flex"
            alignItems="center"
            gap={2.5}
            borderBottom="2px solid"
            borderColor={borderColor}
            bg={isSelected ? selectedBg : 'transparent'}
            opacity={isDisabled ? 0.35 : 1}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            transition="background 0.12s"
            _hover={!isDisabled ? { bg: isSelected ? selectedBg : hoverBg } : {}}
            onClick={!isDisabled ? onToggle : undefined}
            _last={{ borderBottom: 'none' }}
        >
            <Checkbox
                isChecked={isSelected}
                isDisabled={isDisabled}
                colorScheme="blue"
                size="sm"
                flexShrink={0}
                onChange={!isDisabled ? onToggle : undefined}
                onClick={(e) => e.stopPropagation()}
            />
            <Box flex={1} minW={0}>
                <Text
                    fontSize="sm"
                    fontWeight={isSelected ? '600' : '500'}
                    color={isSelected ? nameSelected : namePrimary}
                    noOfLines={1}
                >
                    {quote.vendorName}
                </Text>
                <HStack spacing={1.5} mt={0.5}>
                    <Text fontSize="xs" color={subTextColor}>
                        {quote.quotationNumber}
                    </Text>
                    {/* FIX 1: isExactMatch is now available as a prop */}
                    {isBest && (
                        <BsPatchCheckFill
                            color={isExactMatch ? 'green' : 'orange'}
                            size={14}
                            title={isExactMatch ? 'Best Price (Exact)' : 'Best Price (Alt)'}
                        />
                    )}
                </HStack>
            </Box>
            <Text
                fontSize="sm"
                fontWeight={isBest ? '700' : '500'}
                color={isSelected ? priceSelected : priceColor}
                flexShrink={0}
            >
                {quote.currencyCode ? `${quote.currencyCode} ` : ''}{Number((quote.unitPrice) || 0).toFixed(2)}
            </Text>
        </Box>
    );
};

/* ─── Main component ─── */
export const CompareQuotations = () => {
    const navigate = useNavigate();
    const [allQuotationItems, setQuotationItems] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
    const { rfqId } = useParams<{ rfqId: string }>();
    const [mrNo, setMrNo] = useState<string[]>([]);
    const [groupedQuotations, setGroupedQuotations] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const cardBg = useColorModeValue('white', 'gray.800');
    const rowHoverBg = useColorModeValue('blue.50', 'blue.900');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const sidebarBg = useColorModeValue('white', 'gray.800');
    const sidebarHeaderBg = useColorModeValue('gray.50', 'gray.850');
    const partLabelBg = useColorModeValue('blue.200', 'blue.750');
    const partLabelBorderColor = useColorModeValue('gray.100', 'gray.700');
    const partNumColor = useColorModeValue('gray.700', 'gray.200');
    const reqMetaColor = useColorModeValue('gray.500', 'gray.400');
    const selectedBarBg = useColorModeValue('blue.50', 'blue.900');
    const selectedBarBorder = useColorModeValue('blue.100', 'blue.700');
    const handleConfirm = () => { redirctPage(); handleClose(); };
    const handleClose = () => setIsOpen(false);
    const {
        data: quotationsData,
        isLoading: isQuotationsLoading,
        isError: isQuotationsError,
    } = useQuotationsByRFQ(rfqId);
    const {
        data: prfqData,
        isLoading: isPrfqLoading,
        isError: isPrfqError,
    } = usePRFQDetails(rfqId);

    useEffect(() => {
        if (prfqData?.data?.material_requests) {
            setMrNo([...new Set(prfqData.data.material_requests.map((item: any) => item?.material_request?.code ?? item?.material_request?.id))]);
        }
    }, [prfqData]);

    useEffect(() => {
        if (quotationsData?.data) {
            const allLines = quotationsData.data.flatMap((quotation) =>
                quotation.items?.flatMap((item) =>
                    (item.lines ?? []).map((line) => ({
                        ...line,
                        vendor_id: quotation.vendor_id,
                        quotation_id: quotation.id,
                    }))
                ) ?? []
            );
            setQuotationItems(allLines);
            const grouped = quotationsData.data.reduce((acc: any, quotation) => {
                quotation.items?.forEach((item) => {
                    (item.lines ?? []).forEach((line) => {
                        const key = line.requested_part_number_id ?? line.part_number_id ?? line.id;
                        if (!acc[key]) {
                            acc[key] = {
                                reqPartNumber: line.requested_part_number_id ?? line.part_number_id,
                                reqCN: line.condition_id,
                                reqPrice: line.price,
                                reqQty: line.qty,
                                quotations: [],
                            };
                        }
                        acc[key].quotations.push({
                            id: line.id,
                            quotationId: quotation.id,
                            currencyId: quotation.currency_id,
                            currencyCode: quotation.currency?.symbol ?? '',
                            quotationNumber: quotation.code ?? quotation.id,
                            vendorName: quotation.vendor?.business_name ?? '—',
                            vendorId: quotation.vendor_id,
                            partNumber: line.part_number_id,
                            altPartNumber: '',
                            condition: line.condition?.name,
                            lastTimePurchasedPrice: 0,
                            unitPrice: parseFloat(line.price ?? '0'),
                            material_request: item.material_request,
                            delivery_options: line.delivery_options,
                            recQty: line.qty,
                            moq: line.moq,
                            mov: line.mov,
                            remark: line.remark,
                            part_number: line.part_number,
                            requested_part_number: line.requested_part_number,
                            requested_part_number_id: line.requested_part_number_id,
                        });
                    });
                });
                return acc;
            }, {});
            const sortedGrouped = (Object.values(grouped) as any[]).map((g: any) => ({
                ...g,
                quotations: [...g.quotations].sort((a: any, b: any) => {
                    const aIsExact = a.requested_part_number_id && a.partNumber === a.requested_part_number_id ? 0 : 1;
                    const bIsExact = b.requested_part_number_id && b.partNumber === b.requested_part_number_id ? 0 : 1;
                    if (aIsExact !== bIsExact) return aIsExact - bIsExact;
                    return a.unitPrice - b.unitPrice;
                }),
            }));
            setGroupedQuotations(sortedGrouped);
        }
    }, [quotationsData]);

    /* ─── Derived stats for dashboard ─── */
    const dashboardStats = useMemo(() => {
        if (!groupedQuotations.length) return { bestPrice: 'N/A', fastDelivery: 'N/A', mostQuoted: 'N/A' };
        const allQuotes = groupedQuotations.flatMap((g) => g.quotations);
        const vendorPrices: Record<string, { total: number; count: number; name: string }> = {};
        allQuotes.forEach((q) => {
            if (!vendorPrices[q.vendorId]) vendorPrices[q.vendorId] = { total: 0, count: 0, name: q.vendorName };
            vendorPrices[q.vendorId].total += q.unitPrice;
            vendorPrices[q.vendorId].count += 1;
        });
        const bestPriceVendor =
            Object.values(vendorPrices).sort((a, b) => a.total / a.count - b.total / b.count)[0]?.name ?? 'N/A';
        const mostQuoted =
            Object.values(vendorPrices).sort((a, b) => b.count - a.count)[0]?.name ?? 'N/A';
        return { bestPrice: bestPriceVendor, fastDelivery: 'N/A', mostQuoted };
    }, [groupedQuotations]);

    /* ─── Best price per grouped part ─── */
    const bestPriceByPart = useMemo(() => {
        const exactMap: Record<string, number> = {};
        const altMap: Record<string, number> = {};
        groupedQuotations.forEach((gq) => {
            const exactQuotes = gq.quotations.filter(
                (q: any) => !q.requested_part_number_id || q.partNumber === q.requested_part_number_id
            );
            const altQuotes = gq.quotations.filter(
                (q: any) => q.requested_part_number_id && q.partNumber !== q.requested_part_number_id
            );
            if (exactQuotes.length > 0)
                exactMap[gq.reqPartNumber] = Math.min(...exactQuotes.map((q: any) => q.unitPrice));
            if (altQuotes.length > 0)
                altMap[gq.reqPartNumber] = Math.min(...altQuotes.map((q: any) => q.unitPrice));
        });
        return { exactMap, altMap };
    }, [groupedQuotations]);

    const handleSelectItem = (itemId: string, vendorId: string) => {
        if (selectedVendor === null || selectedVendor === vendorId) {
            setSelectedItems((prev: any) => {
                const updated = prev.includes(itemId) ? prev.filter((id: any) => id !== itemId) : [...prev, itemId];
                setSelectedVendor(updated.length === 0 ? null : vendorId);
                return updated;
            });
        }
    };

    const isItemSelectable = (vendorId: string) =>
        selectedVendor === null || selectedVendor === vendorId;

    const handleSelectAll = (isChecked: boolean) => {
        if (isChecked && selectedVendor !== null) {
            const ids = groupedQuotations.flatMap((rp) =>
                rp.quotations.filter((q: any) => q.vendorId === selectedVendor).map((q: any) => q.id)
            );
            setSelectedItems(ids);
        } else {
            setSelectedItems([]);
            setSelectedVendor(null);
        }
    };

    const isAllSelected =
        selectedVendor !== null &&
        groupedQuotations.flatMap((rp) =>
            rp.quotations.filter((q: any) => q.vendorId === selectedVendor)
        ).length === selectedItems.length;

    const handleCreatePO = () => {
        if (selectedVendor && selectedItems.length > 0) {
            const selectedLines = allQuotationItems.filter((q: any) => selectedItems.includes(q.id));
            const props = ['vendor_id', 'part_number_id', 'condition_id'];
            const hasDupes = selectedLines.every((q: any) =>
                props.every((p) => q[p] === selectedLines[0][p])
            );
            if (selectedLines.length > 1 && hasDupes) setIsOpen(true);
            else redirctPage();
        }
    };

    const redirctPage = () => {
        const itemIds = selectedItems.join(',');
        const selectedLines = allQuotationItems.filter((q: any) => selectedItems.includes(q.id));
        const uniqueQuotations = [...new Set(selectedLines.map((q: any) => q.quotation_id))];
        navigate(
            `/purchase/purchase-order/create?quotation_id=${uniqueQuotations.join(',')}&item_id=${itemIds}`
        );
    };

    const selectedVendorName =
        groupedQuotations
            .flatMap((g) => g.quotations)
            .find((q: any) => q.vendorId === selectedVendor)?.vendorName ?? '—';

    if (isQuotationsError || isPrfqError)
        return (
            <Alert status="error" borderRadius="lg">
                <AlertIcon />
                Could not load quotation data. Please try again.
            </Alert>
        );

    const blueCols = ['Req. Part', 'Quo. No', 'MR No', 'Vendor', 'Quo. Part', 'Quo. CD', 'Last Price'];
    const greenCols = ['Unit Price', 'Rec Qty', 'MOQ', 'MOV', 'Delivery', 'Remark'];

    return (
        <SlideIn>
            <Stack spacing={4} px={2} py={1}>
                <LoadingOverlay isLoading={isQuotationsLoading || isPrfqLoading}>
                    <Stack gap={2}>
                        <HStack justify="space-between">
                            <Stack spacing={0}>
                                <Breadcrumb
                                    fontWeight="medium"
                                    fontSize="sm"
                                    separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
                                >
                                    <BreadcrumbItem color="brand.500">
                                        <BreadcrumbLink as={Link} to="/purchase/purchase-request">
                                            Supplier Pricing Update
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem isCurrentPage color="gray.500">
                                        <BreadcrumbLink>Quotation Comparison</BreadcrumbLink>
                                    </BreadcrumbItem>
                                </Breadcrumb>
                                <Heading as="h4" size="md">
                                    Quotation Comparison
                                </Heading>
                            </Stack>
                            <HStack spacing={2}>
                                <ResponsiveIconButton
                                    variant="@primary"
                                    icon={<HiArrowNarrowLeft />}
                                    size="sm"
                                    fontWeight="thin"
                                    onClick={() => navigate(-1)}
                                >
                                    Back
                                </ResponsiveIconButton>
                            </HStack>
                        </HStack>
                        <Stack
                            bg="#fff"
                            gap={4}
                            borderRadius="md"
                            boxShadow="sm"
                            border="1px solid"
                            borderColor={borderColor}
                            padding={4}
                        >
                            <HStack bg="#0C2556" color="white" px={5} py={3} spacing={8} borderRadius="md" wrap="wrap">

                                <VStack align="start" spacing={0}>
                                    <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="widest" opacity={0.7}>
                                        PRFQ Code
                                    </Text>
                                    <Text fontWeight="700" fontSize="sm">{prfqData?.data?.code}</Text>
                                </VStack>
                                <Divider orientation="vertical" borderColor="whiteAlpha.400" h="32px" />
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="widest" opacity={0.7}>
                                        MR Ref's
                                    </Text>
                                    <Text fontWeight="700" fontSize="sm">
                                        {(mrNo?.slice().sort((a, b) => a.localeCompare(b)).join(', ')) || '—'}
                                    </Text>
                                </VStack>
                                <Divider orientation="vertical" borderColor="whiteAlpha.400" h="32px" />
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="widest" opacity={0.7}>
                                        No of Requested Parts
                                    </Text>
                                    <Text fontWeight="700" fontSize="sm">{groupedQuotations.length}</Text>
                                </VStack>
                                <Divider orientation="vertical" borderColor="whiteAlpha.400" h="32px" />
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="widest" opacity={0.7}>
                                        No of Received Quotations
                                    </Text>
                                    <Text fontWeight="700" fontSize="sm">
                                        {groupedQuotations.reduce((sum, g) => sum + g.quotations.length, 0)}
                                    </Text>
                                </VStack>
                            </HStack>
                            <Flex gap={3} wrap="wrap">
                                <SummaryCard icon={HiOutlineTag} label="Best Price Vendor" value={dashboardStats.bestPrice} accent="blue.600" />
                                <SummaryCard icon={HiOutlineTruck} label="Fast Delivery Vendor" value={dashboardStats.fastDelivery} accent="blue.600" />
                                <SummaryCard icon={HiOutlineShieldCheck} label="Most Quoted Vendor" value={dashboardStats.mostQuoted} accent="blue.600" />
                            </Flex>
                        </Stack>

                        <Box bg={cardBg} borderRadius="md" boxShadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                            <Box px={6} py={3} borderBottom="1px solid" borderColor={borderColor}>
                                <HStack justify="space-between" align="center">
                                    <Text fontWeight="700" fontSize="md" color="gray.700">Comparison Table</Text>
                                    <Button
                                        colorScheme="blue"
                                        size="sm"
                                        borderRadius="md"
                                        px={5}
                                        leftIcon={<HiOutlineBadgeCheck />}
                                        onClick={handleCreatePO}
                                        isDisabled={selectedItems.length === 0}
                                        boxShadow={selectedItems.length > 0 ? 'sm' : 'none'}
                                    >
                                        Create PO{selectedItems.length > 0 ? ` (${selectedItems.length})` : ''}
                                    </Button>
                                </HStack>
                            </Box>

                            {selectedItems.length > 0 && (
                                <HStack bg="green.50" border="1px solid" borderColor="green.200" px={4} py={2} spacing={3} padding={5}>
                                    <Text fontSize="sm" color="green.700" fontWeight="500">
                                        <Text as="span" fontWeight="700"> {selectedItems.length}</Text> item{selectedItems.length > 1 ? 's' : ''} selected from{' '}
                                        <Text as="span" fontWeight="700">{selectedVendorName}</Text>
                                    </Text>
                                    <Button size="xs" colorScheme="red" ml="auto" onClick={() => { setSelectedItems([]); setSelectedVendor(null); }}>
                                        Clear
                                    </Button>
                                </HStack>
                            )}

                            <Flex align="stretch" maxH="calc(100vh - 340px)" minH="400px">
                                {/* Sidebar toggle */}
                                <Box flexShrink={0} display="flex" alignItems="flex-start" borderRight="1px solid" borderColor={borderColor} bg={sidebarHeaderBg}>
                                    <Tooltip label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'} placement="right" hasArrow>
                                        <Icon
                                            as={isSidebarOpen ? TbLayoutSidebarLeftCollapseFilled : TbLayoutSidebarRightCollapseFilled}
                                            boxSize={8}
                                            color="#0C2556"
                                            cursor="pointer"
                                            mt={3}
                                            mx={1}
                                            transition="color 0.2s ease"
                                            _hover={{ color: 'blue.400' }}
                                            onClick={() => setIsSidebarOpen((v) => !v)}
                                            aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                                        />
                                    </Tooltip>
                                </Box>

                                {/* Left sidebar */}
                                <Box
                                    w={isSidebarOpen ? '260px' : '0px'}
                                    minW={isSidebarOpen ? '220px' : '0px'}
                                    flexShrink={0}
                                    borderRight="1px solid"
                                    borderColor={borderColor}
                                    bg={sidebarBg}
                                    display="flex"
                                    flexDirection="column"
                                    overflow="hidden"
                                    transition="width 0.2s ease, min-width 0.2s ease"
                                >
                                    <Box px={4} py={3} bg={sidebarHeaderBg} borderBottom="1px solid" borderColor={borderColor} flexShrink={0}>
                                        <HStack justify="space-between" align="center">
                                            <Text fontSize="sm" fontWeight="700" color="gray.700">Vendor Quotes</Text>
                                            <Checkbox
                                                isChecked={isAllSelected}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                isDisabled={selectedVendor === null}
                                                colorScheme="blue"
                                                size="sm"
                                            />
                                        </HStack>
                                        <Text fontSize="xs" color="gray.500" mt={0.5}>
                                            {groupedQuotations.length} parts ·{' '}
                                            {groupedQuotations.reduce((s, g) => s + g.quotations.length, 0)} quotations
                                        </Text>
                                    </Box>

                                    {selectedItems.length > 0 && (
                                        <HStack mx={3} my={2} px={3} py={2} bg={selectedBarBg} border="1px solid" borderColor={selectedBarBorder} borderRadius="md" flexShrink={0} spacing={2}>
                                            <Text fontSize="xs" color="blue.700" fontWeight="500" flex={1} noOfLines={1}>
                                                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} · {selectedVendorName}
                                            </Text>
                                            <Button size="xs" colorScheme="red" px={1} minW="auto" h="auto" py={0} fontSize="xs" onClick={() => { setSelectedItems([]); setSelectedVendor(null); }}>
                                                Clear
                                            </Button>
                                        </HStack>
                                    )}

                                    <OverlayScrollbarsComponent
                                        options={{ scrollbars: { autoHide: 'leave' } }}
                                        style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}
                                    >
                                        {groupedQuotations.length === 0 ? (
                                            <Text fontSize="xs" color="gray.400" textAlign="center" mt={8} px={4}>No quotations found.</Text>
                                        ) : (
                                            groupedQuotations.map((reqPart, idx) => (
                                                <Box key={idx}>
                                                    <Box px={4} pt={idx === 0 ? 3 : 4} pb={1} bg={partLabelBg} borderBottom="1px solid" borderColor={partLabelBorderColor}>
                                                        <HStack spacing={2} mb={1}>
                                                            <Text fontSize="sm" fontWeight="700" color={partNumColor} noOfLines={1}>
                                                                {reqPart.quotations[0]?.requested_part_number?.name ?? reqPart.reqPartNumber ?? '—'}
                                                            </Text>
                                                        </HStack>
                                                        <HStack justify="space-between" pb={2} w="100%">
                                                            <Text fontSize="xs" color={reqMetaColor}>
                                                                Req. Qty : <strong>{reqPart.reqQty}</strong>
                                                            </Text>
                                                            <HStack spacing={1}>
                                                                <Text fontSize="xs" color={reqMetaColor}>Req. CD :</Text>
                                                                {reqPart.quotations[0]?.condition && (
                                                                    <Badge colorScheme="purple" fontSize="xs" px={2} py={0.5} lineHeight="14px">
                                                                        {reqPart.quotations[0].condition}
                                                                    </Badge>
                                                                )}
                                                            </HStack>
                                                        </HStack>
                                                    </Box>
                                                    {/* FIX 2: Compute isExactMatch per quote and pass to both isBest and isExactMatch props */}
                                                    {reqPart.quotations.map((quote: any) => {
                                                        const sidebarIsExact = !quote.requested_part_number_id || quote.partNumber === quote.requested_part_number_id;
                                                        const sidebarIsBest = sidebarIsExact
                                                            ? quote.unitPrice === bestPriceByPart.exactMap[reqPart.reqPartNumber]
                                                            : quote.unitPrice === bestPriceByPart.altMap[reqPart.reqPartNumber];
                                                        return (
                                                            <SidebarVendorItem
                                                                key={quote.id}
                                                                quote={quote}
                                                                isBest={sidebarIsBest}
                                                                isExactMatch={sidebarIsExact}
                                                                isSelected={selectedItems.includes(quote.id)}
                                                                isDisabled={!isItemSelectable(quote.vendorId)}
                                                                onToggle={() => handleSelectItem(quote.id, quote.vendorId)}
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            ))
                                        )}
                                        <Text fontSize="10px" color="gray.400" textAlign="center" fontStyle="italic" px={4} py={3}>
                                            Select quotes from one vendor at a time
                                        </Text>
                                    </OverlayScrollbarsComponent>
                                </Box>

                                {/* Right table area */}
                                <OverlayScrollbarsComponent
                                    options={{ scrollbars: { autoHide: 'leave' } }}
                                    style={{ flex: 1, overflow: 'hidden' }}
                                >
                                    <Table variant="unstyled" size="sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                                        <Thead>
                                            <Tr>
                                                <Th bg="blue.600" color="white" borderRight="1px solid" borderColor="gray.600" position="sticky" left={0} top={0} zIndex={3} px={3} py={3}>
                                                    <Checkbox
                                                        isChecked={isAllSelected}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                        isDisabled={selectedVendor === null}
                                                        colorScheme="blue"
                                                        size="sm"
                                                    />
                                                </Th>
                                                {blueCols.map((col) => (
                                                    <Th key={col} bg="blue.600" color="white" borderRight="1px solid" borderColor="gray.600" py={3} fontSize="10px" letterSpacing="wider" textTransform="uppercase" whiteSpace="nowrap" position="sticky" top={0} zIndex={2}>
                                                        {col}
                                                    </Th>
                                                ))}
                                                {greenCols.map((col, i) => (
                                                    <Th key={col} bg="green.600" color="white" borderRight={i < greenCols.length - 1 ? '1px solid' : 'none'} borderColor="green.400" py={3} fontSize="10px" letterSpacing="wider" textTransform="uppercase" whiteSpace="nowrap" position="sticky" top={0} zIndex={2}>
                                                        {col}
                                                    </Th>
                                                ))}
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {groupedQuotations.map((reqPart, reqPartIndex) => (
                                                <React.Fragment key={reqPartIndex}>
                                                    {reqPart.quotations.map((quote: any, quoteIndex: number) => {
                                                        const disabled = !isItemSelectable(quote.vendorId);
                                                        const selected = selectedItems.includes(quote.id);
                                                        const isExactMatch = !quote.requested_part_number_id || quote.partNumber === quote.requested_part_number_id;
                                                        const isBest = isExactMatch
                                                            ? quote.unitPrice === bestPriceByPart.exactMap[reqPart.reqPartNumber]
                                                            : quote.unitPrice === bestPriceByPart.altMap[reqPart.reqPartNumber];
                                                        return (
                                                            <Tr
                                                                key={`${quoteIndex}_${quote.id}`}
                                                                bg={selected ? 'blue.50' : disabled ? 'gray.50' : 'white'}
                                                                opacity={disabled ? 0.45 : 1}
                                                                transition="background 0.15s"
                                                                _hover={!disabled ? { bg: selected ? 'blue.100' : rowHoverBg } : {}}
                                                            >
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} px={3} position="sticky" left={0} bg={selected ? 'blue.50' : disabled ? 'gray.50' : 'white'} zIndex={1} whiteSpace="nowrap">
                                                                    <Checkbox isChecked={selected} onChange={() => handleSelectItem(quote.id, quote.vendorId)} isDisabled={disabled} colorScheme="blue" size="sm" />
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5} whiteSpace="nowrap">
                                                                    <Text fontSize="sm" fontWeight="600">{quote.requested_part_number?.name}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5} whiteSpace="nowrap">
                                                                    <Text fontSize="xs" fontWeight="600" color="blue.600">{quote.quotationNumber}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5} whiteSpace="nowrap">
                                                                    <Text fontSize="xs">{quote.material_request?.ref ?? quote.material_request?.id ?? '—'}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5}>
                                                                    <Text fontSize="sm" fontWeight="600">{quote.vendorName}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5} whiteSpace="nowrap">
                                                                    {(() => {
                                                                        const isMatch = !quote.requested_part_number_id || quote.requested_part_number_id === quote.partNumber;
                                                                        const content = (
                                                                            <Box>
                                                                                <Text fontSize="sm" fontWeight="600" color={isMatch ? 'green.700' : 'orange.500'} cursor="default" display="inline-block">
                                                                                    {quote.part_number?.name ?? '—'}
                                                                                </Text>
                                                                                <Text fontSize="xs" color="gray.500" display="block" mt={0.5}>
                                                                                    {quote.part_number?.description ?? '—'}
                                                                                </Text>
                                                                            </Box>
                                                                        );
                                                                        if (!isMatch) {
                                                                            return (
                                                                                <Tooltip label={`Requested: ${quote.requested_part_number?.name ?? quote.requested_part_number_id ?? '—'}`} placement="top" hasArrow fontSize="xs">
                                                                                    {content}
                                                                                </Tooltip>
                                                                            );
                                                                        }
                                                                        return content;
                                                                    })()}
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5}>
                                                                    <Badge fontSize="xs" colorScheme="purple" px={2} py={1}>{quote.condition ?? '—'}</Badge>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5}>
                                                                    {quote.lastTimePurchasedPrice !== 0 ? (
                                                                        <HStack spacing={1}><Text fontSize="xs">{quote.lastTimePurchasedPrice}</Text></HStack>
                                                                    ) : (
                                                                        <Text fontSize="xs" color="gray.400">—</Text>
                                                                    )}
                                                                </Td>
                                                                {/* FIX 3: Pass isExactMatch to PriceChip */}
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5} bg={isBest ? 'green.50' : undefined} whiteSpace="nowrap" minW={150}>
                                                                    <PriceChip price={quote.unitPrice} isBest={isBest} isExactMatch={isExactMatch} currency={quote.currencyCode} />
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5}>
                                                                    <Text fontSize="xs">{quote.recQty ?? '—'}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5}>
                                                                    <Text fontSize="xs">{quote.moq ?? '—'}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5}>
                                                                    <Text fontSize="xs">{quote.mov ?? '—'}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderRight="1px solid" borderColor={borderColor} py={2.5}>
                                                                    <Text fontSize="xs" color="gray.600">{quote.delivery_options ?? '—'}</Text>
                                                                </Td>
                                                                <Td borderBottom="1px solid" borderColor={borderColor} py={2.5}>
                                                                    <Text fontSize="xs" color={quote.remark ? 'gray.700' : 'gray.400'}>{quote.remark || 'N/A'}</Text>
                                                                </Td>
                                                            </Tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                            {groupedQuotations.length === 0 && (
                                                <Tr>
                                                    <Td colSpan={15} textAlign="center" py={12}>
                                                        <VStack spacing={2}>
                                                            <Text fontSize="sm" color="gray.500">No quotations found for this RFQ.</Text>
                                                        </VStack>
                                                    </Td>
                                                </Tr>
                                            )}
                                        </Tbody>
                                    </Table>
                                </OverlayScrollbarsComponent>
                            </Flex>
                        </Box>

                        <ConfirmationPopup
                            isOpen={isOpen}
                            onClose={handleClose}
                            onConfirm={handleConfirm}
                            headerText="Duplicate Entry"
                            bodyText="This condition has already been added for this part number. Do you want to continue?"
                        />
                    </Stack>
                </LoadingOverlay>
            </Stack>
        </SlideIn>
    );
};

export default CompareQuotations;
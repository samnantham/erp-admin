import {
    Box,
    HStack,
    Heading,
    Stack,
    SimpleGrid,
    Divider,
    Text,
    Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";

import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useApprovalsDashboard } from '@/services/cud-requests/service';
import { ModuleApproval, ApprovalCounts } from '@/services/cud-requests/schema';

export const CUDRequestDashboard = () => {
    const navigate = useNavigate();
    const { data, isFetching } = useApprovalsDashboard();

    return (
        <SlideIn>
            <Stack spacing={4}>
                <HStack justify="space-between">
                    <Heading size="md">Update & Delete Approvals - Dashboard</Heading>
                    <ResponsiveIconButton
                        icon={<MdArrowBack />}
                        onClick={() => navigate(-1)}
                        variant="@primary"
                    >
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <Box borderRadius={4}>
                    <LoadingOverlay isLoading={isFetching}>
                        <Box bg="white" borderRadius={4} minH="80vh" p={4}>
                            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={6}>
                                {data?.data.map((item: ModuleApproval) => (
                                    <ModuleCard
                                        key={item.value}
                                        item={item}
                                        onNavigate={navigate}
                                    />
                                ))}
                            </SimpleGrid>
                        </Box>
                    </LoadingOverlay>
                </Box>
            </Stack>
        </SlideIn>
    );
};

interface ModuleCardProps {
    item: ModuleApproval;
    onNavigate: (path: string) => void;
}

interface ActionCountsProps {
    label: "CREATE" | "UPDATE" | "DELETE";
    counts: ApprovalCounts;
}

interface CountRowProps {
    dot: string;
    label: string;
    value: number;
}

/* ================= Module Card ================= */

// All cards share this fixed height so the grid rows are uniform.
// The sections area inside scrolls when content overflows (e.g. Purchase with CREATE+UPDATE+DELETE).
const CARD_HEIGHT        = "420px";
const CARD_HEADER_HEIGHT = "130px"; // module name + big number + subtitle
const SECTIONS_HEIGHT    = `calc(${CARD_HEIGHT} - ${CARD_HEADER_HEIGHT})`;

const ModuleCard = ({ item, onNavigate }: ModuleCardProps) => {
    const isDisabled   = !item.has_link;
    const hasCreate    = !!item.create;
    const totalPending =
        item.update.pending +
        item.delete.pending +
        (item.create?.pending ?? 0);

    const sectionContent = (
        <Box pr={1}>
            {hasCreate && (
                <>
                    <ActionCounts label="CREATE" counts={item.create!} />
                    <Divider borderColor="whiteAlpha.100" my={3} />
                </>
            )}
            <ActionCounts label="UPDATE" counts={item.update} />
            <Divider borderColor="whiteAlpha.100" my={3} />
            <ActionCounts label="DELETE" counts={item.delete} />
        </Box>
    );

    return (
        <Box
            bg="#0c2556"
            borderRadius="2xl"
            p={5}
            h={CARD_HEIGHT}
            overflow="hidden"
            position="relative"
            cursor={isDisabled ? "not-allowed" : "pointer"}
            opacity={isDisabled ? 0.5 : 1}
            role="group"
            border="1.5px solid rgba(255,255,255,0.08)"
            transition="transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease, border-color 0.35s ease"
            _hover={isDisabled ? {} : {
                transform: "translateY(-8px) scale(1.02)",
                borderColor: "#60a5fa",
                boxShadow: "0 0 0 1px #60a5fa, 0 24px 48px rgba(12,37,86,0.5)",
            }}
            onClick={() => !isDisabled && item.link && onNavigate(item.link)}
            sx={{
                "&::after": {
                    content: '""',
                    position: "absolute",
                    top: "-40px",
                    right: "-40px",
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background: "rgba(59,130,246,0.06)",
                    transition: "all 0.5s ease",
                    pointerEvents: "none",
                },
                "&:hover::after": isDisabled ? {} : {
                    transform: "scale(2.5)",
                    background: "rgba(59,130,246,0.12)",
                },
            }}
        >
            {/* ── Header — never scrolls ── */}
            <Text
                fontSize="13px"
                fontWeight="600"
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="gray.500"
                mb={1}
                transition="color 0.3s ease"
                _groupHover={isDisabled ? {} : { color: "blue.300" }}
            >
                {item.module}
            </Text>

            <Text
                fontSize="48px"
                fontWeight="700"
                color="white"
                lineHeight="1"
                mb={1}
                transition="all 0.3s ease"
                _groupHover={isDisabled ? {} : {
                    color: "yellow.200",
                    textShadow: "0 0 20px rgba(253,230,138,0.3)",
                }}
            >
                {totalPending}
            </Text>

            <Text fontSize="13px" color="gray.600" mb={4} textTransform="capitalize">
                pending approvals
            </Text>

            {/* ── Sections — scroll only when create exists ── */}
            {hasCreate ? (
                <OverlayScrollbarsComponent
                    options={{
                        scrollbars: { autoHide: "scroll", theme: "os-theme-light" },
                        overflow: { x: "hidden", y: "scroll" },
                    }}
                    style={{ height: SECTIONS_HEIGHT }}
                >
                    {sectionContent}
                </OverlayScrollbarsComponent>
            ) : (
                sectionContent
            )}
        </Box>
    );
};

/* ================= Action Counts ================= */

const ACTION_STYLES: Record<"CREATE" | "UPDATE" | "DELETE", { bg: string; color: string; border: string }> = {
    CREATE: {
        bg:     "rgba(16,185,129,0.15)",
        color:  "green.300",
        border: "rgba(16,185,129,0.2)",
    },
    UPDATE: {
        bg:     "rgba(59,130,246,0.15)",
        color:  "blue.300",
        border: "rgba(59,130,246,0.2)",
    },
    DELETE: {
        bg:     "rgba(239,68,68,0.12)",
        color:  "red.400",
        border: "rgba(239,68,68,0.15)",
    },
};

const ActionCounts = ({ label, counts }: ActionCountsProps) => {
    const styles = ACTION_STYLES[label];
    const approvedPct = counts.total === 0
        ? 0
        : Math.round((counts.approved / counts.total) * 100);

    return (
        <Box>
            <HStack justify="space-between" mb={2}>
                <Badge
                    fontSize="11px"
                    fontWeight="600"
                    letterSpacing="0.06em"
                    px={2}
                    py="2px"
                    borderRadius="full"
                    bg={styles.bg}
                    color={styles.color}
                    border="1px solid"
                    borderColor={styles.border}
                >
                    {label}
                </Badge>
                <Text fontSize="12px" color="gray.600">{counts.total} total</Text>
            </HStack>

            <CountRow dot="#fbbf24" label="Pending"  value={counts.pending}  />
            <CountRow dot="#34d399" label="Approved" value={counts.approved} />
            <CountRow dot="#f87171" label="Rejected" value={counts.rejected} />

            <Box h="3px" bg="whiteAlpha.100" borderRadius="full" mt={2} overflow="hidden">
                <Box
                    h="100%"
                    w={`${approvedPct}%`}
                    bgGradient="linear(to-r, #34d399, #059669)"
                    borderRadius="full"
                    transition="width 0.6s ease"
                />
            </Box>
        </Box>
    );
};

/* ================= Count Row ================= */

const CountRow = ({ dot, label, value }: CountRowProps) => (
    <HStack justify="space-between" py="3px">
        <HStack spacing={2}>
            <Box w="7px" h="7px" borderRadius="full" bg={dot} flexShrink={0} />
            <Text fontSize="13px" color="gray.500">{label}</Text>
        </HStack>
        <Text fontSize="13px" fontWeight="600" color="gray.300">{value}</Text>
    </HStack>
);

export default CUDRequestDashboard;
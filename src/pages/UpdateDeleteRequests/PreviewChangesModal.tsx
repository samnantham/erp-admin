import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, Table, Thead, Tbody, Tr, Th, Td, Badge,
    Text, Box, HStack, Button, Divider, Tabs, TabList, Tab, TabPanels, TabPanel,
} from "@chakra-ui/react";
import { ArrayColumn, DisplayProp, DisplayPropBase } from "@/pages/UpdateDeleteRequests/modules/types";
import DocumentDownloadButton from "@/components/DocumentDownloadButton";
import { useState } from "react";
import { format } from 'date-fns';
import { usePDFPreviewController } from '@/api/hooks/usePDFPreviewController';
import { usePDFPreview } from "@/context/PDFPreviewContext";


// ================= Types =================

interface PreviewChangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewRow: any;
    displayProps: DisplayProp[];
    isProcessing: boolean;
    onApprove: () => void;
    onReject: () => void;
    config?: any;
}

// ================= Cell Renderer =================

const RenderCell = ({
    value, renderAs, isChanged,
}: {
    value: any;
    renderAs?: DisplayPropBase["renderAs"];
    isChanged: boolean;
}) => {
    if (value === null || value === undefined || value === "") {
        return <Text as="span" color="gray.400">—</Text>;
    }
    if (renderAs === "doc") {
        return <DocumentDownloadButton size="xs" url={String(value)} />;
    }
    if (renderAs === "boolean" || typeof value === "boolean") {
        return (
            <Text as="span" fontWeight={isChanged ? "semibold" : "normal"}>
                {value ? "Yes" : "No"}
            </Text>
        );
    }
    return (
        <Text as="span" fontWeight={isChanged ? "semibold" : "normal"}>
            {String(value)}
        </Text>
    );
};

// ================= Array Cell Renderer =================

const RenderArrayCell = ({ col, value }: { col: ArrayColumn; value: any }) => {
    if (value === null || value === undefined || value === "") {
        return <Text fontSize="xs" color="gray.400">—</Text>;
    }
    if (col.renderAs === "doc") {
        return <DocumentDownloadButton size="xs" url={String(value)} />;
    }
    if (col.renderAs === "boolean" || typeof value === "boolean") {
        return <Text fontSize="xs">{value ? "Yes" : "No"}</Text>;
    }
    if (col.renderAs === "date") {
        return <Text fontSize="xs">{String(format(new Date(value), 'dd MMM yyyy'))}</Text>;
    }
    return <Text fontSize="xs" color="gray.700">{String(value)}</Text>;
};

// ================= Array Field Renderer =================

const RenderArrayField = ({
    label, field, oldRows, newRows, renderTable,
}: {
    label: string;
    field: Extract<DisplayProp, { kind: "array" }>;
    oldRows: any[];
    newRows: any[];
    renderTable: (rows: any[], columns: ArrayColumn[]) => React.ReactNode;
}) => {
    // ── useState inside the component ──
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const hasChanges = JSON.stringify(oldRows) !== JSON.stringify(newRows);

    return (
        <Box mb={6}>
            <HStack mb={2} spacing={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">{label}</Text>
                {hasChanges && (
                    <Badge colorScheme="orange" fontSize="xs">Changed</Badge>
                )}
            </HStack>

            <Tabs
                variant="unstyled"
                index={activeTabIndex}
                onChange={(index) => setActiveTabIndex(index)}
            >
                <TabList>
                    <Tab
                        fontSize="sm"
                        bg={activeTabIndex === 0 ? "#0C2556" : "gray.200"}
                        color={activeTabIndex === 0 ? "white" : "gray.600"}
                        px={3} py={1}
                        _selected={{}}
                        _hover={{ bg: activeTabIndex === 0 ? "#0C2556" : "gray.300" }}
                    >
                        Active
                        <Badge ml={1} colorScheme="gray" fontSize="xs">
                            {oldRows.length}
                        </Badge>
                    </Tab>
                    <Tab
                        fontSize="sm"
                        bg={activeTabIndex === 1 ? "#0C2556" : "gray.200"}
                        color={activeTabIndex === 1 ? "white" : "gray.600"}
                        px={3} py={1}
                        _selected={{}}
                        _hover={{ bg: activeTabIndex === 1 ? "#0C2556" : "gray.300" }}
                    >
                        Updated
                        <Badge ml={1} colorScheme={hasChanges ? "orange" : "gray"} fontSize="xs">
                            {newRows.length}
                        </Badge>
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel px={0} py={2}>
                        {renderTable(oldRows, field.columns ?? [])}
                    </TabPanel>
                    <TabPanel px={0} py={2}>
                        {renderTable(newRows, field.columns ?? [])}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

// ================= Component =================

export const PreviewChangesModal = ({
    isOpen, onClose, previewRow,
    displayProps, isProcessing, onApprove, onReject, config
}: PreviewChangesModalProps) => {

    if (!isOpen) return null;

    const { openPreview } = usePDFPreview();

    const oldRecord = previewRow?.old_data ?? {};
    const newRecord = previewRow?.new_data ?? {};

    const previewConfig = config?.preview;

    console.log(previewConfig)

    const handleOldPreview = () => {
        if (!previewConfig?.getOldPreviewUrl) return;

        const url = previewConfig.getOldPreviewUrl(previewRow);
        openPreview(url, "Preview", true);
    };

    const previewPDF = usePDFPreviewController({
        url: previewConfig?.getNewPreviewRequest?.(previewRow)?.url || "",
        title: "Preview (Updated)",
    });

    const handleNewPreview = () => {
        if (!previewConfig?.getNewPreviewRequest) return;
        const req = previewConfig.getNewPreviewRequest(previewRow);
        if (!req?.body) return;
        previewPDF.open(req.body, "Preview (Updated)");
    };

    const scalarProps = displayProps.filter((p) => !p.kind || p.kind === "scalar");
    const arrayProps = displayProps.filter((p) => p.kind === "array") as Extract<DisplayProp, { kind: "array" }>[];

    const isChanged = (key: string) =>
        String(oldRecord[key] ?? "") !== String(newRecord[key] ?? "");
    const changedCount = scalarProps.filter((p) => isChanged(p.key)).length;
    const isPending = previewRow?.status === "pending";

    const renderTable = (rows: any[], cols: ArrayColumn[]) => {
        if (rows.length === 0) {
            return (
                <Text fontSize="sm" color="gray.400" py={4} textAlign="center">
                    None
                </Text>
            );
        }
        return (
            <Box overflowX="auto">
                <Table size="sm" variant="simple">
                    <Thead bg="gray.50">
                        <Tr>
                            <Th>#</Th>
                            {cols.map((col, index) => (
                                <Th key={`${col.key}-${index}`}>{col.label}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {rows.map((row, i) => (
                            <Tr key={i}>
                                <Td color="gray.400" fontSize="xs">{i + 1}</Td>
                                {cols.map((col, n) => (
                                    <Td key={n}>
                                        <RenderArrayCell col={col} value={row[col.key]} />
                                    </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxH="85vh" display="flex" flexDirection="column" overflow="hidden">

                {/* ── Header ── */}
                <ModalHeader
                    fontSize="md"
                    fontWeight="bold"
                    flexShrink={0}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                >
                    Preview Changes
                    {changedCount > 0 && (
                        <Badge ml={2} colorScheme="orange" fontSize="xs">
                            {changedCount} field{changedCount > 1 ? "s" : ""} modified
                        </Badge>
                    )}
                </ModalHeader>
                <ModalCloseButton />

                {/* ── Body ── */}
                <ModalBody flex="1" overflowY="auto" overflowX="hidden" pb={4} px={4}>

                    {/* scalar fields */}
                    {scalarProps.length > 0 && (
                        <Box overflowX="auto" mb={6}>
                            <Table size="sm" variant="simple">
                                <Thead bg="gray.100" position="sticky" top={0} zIndex={1}>
                                    <Tr>
                                        <Th w="30%">Field</Th>
                                        <Th w="30%">Current Value</Th>
                                        <Th w="30%">New Value</Th>
                                        <Th w="10%">Status</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {scalarProps.map(({ label, key, renderAs }, index) => {
                                        const changed = isChanged(key);
                                        return (
                                            <Tr key={`${key}-${index}`} bg={changed ? "orange.50" : "white"}>
                                                <Td fontWeight="medium" color="gray.600">{label}</Td>
                                                <Td color={changed ? "red.600" : "gray.700"}>
                                                    <RenderCell value={oldRecord[key]} renderAs={renderAs} isChanged={changed} />
                                                </Td>
                                                <Td color={changed ? "green.600" : "gray.700"}>
                                                    <RenderCell value={newRecord[key]} renderAs={renderAs} isChanged={changed} />
                                                </Td>
                                                <Td>
                                                    {changed && (
                                                        <Badge colorScheme="orange" fontSize="xs">Modified</Badge>
                                                    )}
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                    {previewConfig?.enabled && (
                                        <Tr bg="gray.50">
                                            <Td fontWeight="bold">Preview</Td>

                                            {/* OLD PREVIEW */}
                                            <Td>
                                                {previewConfig.getOldPreviewUrl && (
                                                    <Button size="xs" variant="outline" onClick={handleOldPreview}>
                                                        Preview Current
                                                    </Button>
                                                )}
                                            </Td>

                                            {/* NEW PREVIEW */}
                                            <Td>
                                                {previewConfig.getNewPreviewRequest && (
                                                    <Button size="xs" colorScheme="blue" onClick={handleNewPreview}>
                                                        Preview New
                                                    </Button>
                                                )}
                                            </Td>

                                            {/* EMPTY STATUS */}
                                            <Td />
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </Box>
                    )}

                    {/* array fields */}
                    {arrayProps.length > 0 && (
                        <>
                            <Divider mb={4} />
                            {arrayProps.map((field) => (
                                <RenderArrayField
                                    key={field.key}
                                    label={field.label}
                                    field={field}
                                    oldRows={oldRecord[field.key] ?? []}
                                    newRows={newRecord[field.key] ?? []}
                                    renderTable={renderTable}
                                />
                            ))}
                        </>
                    )}

                    {displayProps.length === 0 && (
                        <Text color="gray.500" textAlign="center" py={8}>
                            No data available.
                        </Text>
                    )}
                </ModalBody>

                {/* ── Footer ── */}
                {isPending && (
                    <Box
                        px={6} py={4}
                        borderTop="1px solid"
                        borderColor="gray.200"
                        bg="gray.50"
                        borderBottomRadius="md"
                        flexShrink={0}
                    >
                        <HStack justify="flex-end" spacing={3}>
                            <Button
                                size="sm"
                                variant="solid"
                                colorScheme="red"
                                isLoading={isProcessing}
                                onClick={onReject}
                            >
                                Reject
                            </Button>
                            <Button
                                size="sm"
                                colorScheme="green"
                                isLoading={isProcessing}
                                onClick={onApprove}
                            >
                                Approve
                            </Button>
                        </HStack>
                    </Box>
                )}
            </ModalContent>
        </Modal>
    );
};
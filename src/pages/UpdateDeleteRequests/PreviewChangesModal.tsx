import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, Table, Thead, Tbody, Tr, Th, Td, Badge,
    Text, Box, HStack, Button, Divider,
} from "@chakra-ui/react";
import { ArrayColumn, DisplayProp, DisplayPropBase } from "@/pages/UpdateDeleteRequests/modules/types";
import DocumentDownloadButton from "@/components/DocumentDownloadButton";
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

type RowDiffStatus = "added" | "deleted" | "modified" | "unchanged";

interface DiffedRow {
    status: RowDiffStatus;
    oldRow: any | null;
    newRow: any | null;
}

// ================= Diff Utilities =================

/**
 * Produces a unified diff list between oldRows and newRows.
 * Uses JSON identity matching: tries to find each old row in newRows.
 * Rows not matched are marked deleted; unmatched new rows are marked added.
 * Matched rows with differing fields are marked modified.
 */
function diffArrayRows(oldRows: any[], newRows: any[], cols: ArrayColumn[]): DiffedRow[] {
    const keys = cols.map((c) => c.key);

    // Clone arrays so we can splice matched items out
    const remainingNew = newRows.map((r, i) => ({ row: r, originalIndex: i, matched: false }));

    const result: DiffedRow[] = [];

    for (const oldRow of oldRows) {
        // Try to find an exact match first
        const exactIdx = remainingNew.findIndex(
            (n) => !n.matched && keys.every((k) => String(n.row[k] ?? "") === String(oldRow[k] ?? ""))
        );

        if (exactIdx !== -1) {
            remainingNew[exactIdx].matched = true;
            result.push({ status: "unchanged", oldRow, newRow: remainingNew[exactIdx].row });
            continue;
        }

        // Try to find a partial match (same "identity" key — first column — but different other fields)
        const firstKey = keys[0];
        const partialIdx = remainingNew.findIndex(
            (n) => !n.matched && String(n.row[firstKey] ?? "") === String(oldRow[firstKey] ?? "")
        );

        if (partialIdx !== -1) {
            remainingNew[partialIdx].matched = true;
            result.push({ status: "modified", oldRow, newRow: remainingNew[partialIdx].row });
        } else {
            // No match at all → deleted
            result.push({ status: "deleted", oldRow, newRow: null });
        }
    }

    // Anything left in remainingNew is purely added
    for (const n of remainingNew) {
        if (!n.matched) {
            result.push({ status: "added", oldRow: null, newRow: n.row });
        }
    }

    return result;
}

const ROW_COLORS: Record<RowDiffStatus, { bg: string; badge: string; label: string }> = {
    added:     { bg: "green.50",  badge: "green",  label: "Added"     },
    deleted:   { bg: "red.50",    badge: "red",     label: "Deleted"   },
    modified:  { bg: "orange.50", badge: "orange",  label: "Modified"  },
    unchanged: { bg: "white",     badge: "gray",    label: ""          },
};

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

const RenderArrayCell = ({ col, value, isChanged }: { col: ArrayColumn; value: any; isChanged?: boolean }) => {
    if (value === null || value === undefined || value === "") {
        return <Text fontSize="xs" color="gray.400">—</Text>;
    }
    if (col.renderAs === "doc") {
        return <DocumentDownloadButton size="xs" url={String(value)} />;
    }
    if (col.renderAs === "boolean" || typeof value === "boolean") {
        return <Text fontSize="xs" fontWeight={isChanged ? "semibold" : "normal"}>{value ? "Yes" : "No"}</Text>;
    }
    if (col.renderAs === "date") {
        return <Text fontSize="xs" fontWeight={isChanged ? "semibold" : "normal"}>{String(format(new Date(value), 'dd MMM yyyy'))}</Text>;
    }
    return <Text fontSize="xs" color="gray.700" fontWeight={isChanged ? "semibold" : "normal"}>{String(value)}</Text>;
};

// ================= Diff Array Field Renderer =================

const RenderArrayFieldDiff = ({
    label,
    field,
    oldRows,
    newRows,
}: {
    label: string;
    field: Extract<DisplayProp, { kind: "array" }>;
    oldRows: any[];
    newRows: any[];
}) => {
    const cols = field.columns ?? [];
    const diffed = diffArrayRows(oldRows, newRows, cols);

    const addedCount    = diffed.filter((d) => d.status === "added").length;
    const deletedCount  = diffed.filter((d) => d.status === "deleted").length;
    const modifiedCount = diffed.filter((d) => d.status === "modified").length;
    const hasChanges    = addedCount + deletedCount + modifiedCount > 0;

    return (
        <Box mb={6}>
            {/* Header */}
            <HStack mb={2} spacing={2} flexWrap="wrap">
                <Text fontSize="sm" fontWeight="600" color="gray.600">{label}</Text>
                {addedCount > 0 && (
                    <Badge colorScheme="green" fontSize="xs">{addedCount} added</Badge>
                )}
                {deletedCount > 0 && (
                    <Badge colorScheme="red" fontSize="xs">{deletedCount} deleted</Badge>
                )}
                {modifiedCount > 0 && (
                    <Badge colorScheme="orange" fontSize="xs">{modifiedCount} modified</Badge>
                )}
                {!hasChanges && (
                    <Badge colorScheme="gray" fontSize="xs">No changes</Badge>
                )}
            </HStack>

            {diffed.length === 0 ? (
                <Text fontSize="sm" color="gray.400" py={4} textAlign="center">None</Text>
            ) : (
                <Box overflowX="auto" borderRadius="md" border="1px solid" borderColor="gray.200">
                    <Table size="sm" variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th w="28px">#</Th>
                                {/* For each column: show two sub-columns (Current / New) only if there are changes */}
                                {cols.map((col, i) => (
                                    hasChanges ? (
                                        // Split header across two columns
                                        <Th
                                            key={`header-${col.key}-${i}`}
                                            colSpan={2}
                                            textAlign="center"
                                            borderLeft="1px solid"
                                            borderColor="gray.200"
                                            px={2}
                                        >
                                            {col.label}
                                        </Th>
                                    ) : (
                                        <Th key={`header-${col.key}-${i}`}>{col.label}</Th>
                                    )
                                ))}
                                <Th w="80px">Status</Th>
                            </Tr>
                            {hasChanges && (
                                <Tr bg="gray.100">
                                    <Th />
                                    {cols.map((col, i) => (
                                        <>
                                            <Th
                                                key={`sub-old-${col.key}-${i}`}
                                                fontSize="9px"
                                                color="red.500"
                                                borderLeft="1px solid"
                                                borderColor="gray.200"
                                                px={2}
                                                py={1}
                                                textTransform="uppercase"
                                            >
                                                Current
                                            </Th>
                                            <Th
                                                key={`sub-new-${col.key}-${i}`}
                                                fontSize="9px"
                                                color="green.600"
                                                px={2}
                                                py={1}
                                                textTransform="uppercase"
                                            >
                                                New
                                            </Th>
                                        </>
                                    ))}
                                    <Th />
                                </Tr>
                            )}
                        </Thead>
                        <Tbody>
                            {diffed.map((diff, rowIdx) => {
                                const { status, oldRow, newRow } = diff;
                                const { bg, badge, label: statusLabel } = ROW_COLORS[status];

                                return (
                                    <Tr key={rowIdx} bg={bg}>
                                        <Td color="gray.400" fontSize="xs">{rowIdx + 1}</Td>

                                        {cols.map((col, colIdx) => {
                                            const oldVal = oldRow?.[col.key];
                                            const newVal = newRow?.[col.key];
                                            const cellChanged =
                                                status === "modified" &&
                                                String(oldVal ?? "") !== String(newVal ?? "");

                                            if (!hasChanges) {
                                                // Simple single-value display when no diffs at all
                                                return (
                                                    <Td key={colIdx}>
                                                        <RenderArrayCell col={col} value={oldVal ?? newVal} />
                                                    </Td>
                                                );
                                            }

                                            return (
                                                <>
                                                    {/* Current value */}
                                                    <Td
                                                        key={`old-${colIdx}`}
                                                        borderLeft="1px solid"
                                                        borderColor="gray.200"
                                                        bg={
                                                            status === "deleted"
                                                                ? "red.100"
                                                                : cellChanged
                                                                ? "red.50"
                                                                : undefined
                                                        }
                                                        color={cellChanged || status === "deleted" ? "red.700" : undefined}
                                                        textDecoration={status === "deleted" ? "line-through" : undefined}
                                                    >
                                                        {status === "added" ? (
                                                            <Text fontSize="xs" color="gray.300">—</Text>
                                                        ) : (
                                                            <RenderArrayCell col={col} value={oldVal} isChanged={cellChanged} />
                                                        )}
                                                    </Td>

                                                    {/* New value */}
                                                    <Td
                                                        key={`new-${colIdx}`}
                                                        bg={
                                                            status === "added"
                                                                ? "green.100"
                                                                : cellChanged
                                                                ? "green.50"
                                                                : undefined
                                                        }
                                                        color={cellChanged || status === "added" ? "green.700" : undefined}
                                                    >
                                                        {status === "deleted" ? (
                                                            <Text fontSize="xs" color="gray.300">—</Text>
                                                        ) : (
                                                            <RenderArrayCell col={col} value={newVal} isChanged={cellChanged} />
                                                        )}
                                                    </Td>
                                                </>
                                            );
                                        })}

                                        <Td>
                                            {statusLabel && (
                                                <Badge colorScheme={badge} fontSize="xs">
                                                    {statusLabel}
                                                </Badge>
                                            )}
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </Box>
            )}
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
    const arrayProps  = displayProps.filter((p) => p.kind === "array") as Extract<DisplayProp, { kind: "array" }>[];

    const isChanged = (key: string) =>
        String(oldRecord[key] ?? "") !== String(newRecord[key] ?? "");
    const changedCount = scalarProps.filter((p) => isChanged(p.key)).length;
    const isPending = previewRow?.status === "pending";

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
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
                                            <Td>
                                                {previewConfig.getOldPreviewUrl && (
                                                    <Button size="xs" variant="outline" onClick={handleOldPreview}>
                                                        Preview Current
                                                    </Button>
                                                )}
                                            </Td>
                                            <Td>
                                                {previewConfig.getNewPreviewRequest && (
                                                    <Button size="xs" colorScheme="blue" onClick={handleNewPreview}>
                                                        Preview New
                                                    </Button>
                                                )}
                                            </Td>
                                            <Td />
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </Box>
                    )}

                    {/* array fields — now with diff view */}
                    {arrayProps.length > 0 && (
                        <>
                            <Divider mb={4} />
                            {arrayProps.map((field) => (
                                <RenderArrayFieldDiff
                                    key={field.key}
                                    label={field.label}
                                    field={field}
                                    oldRows={oldRecord[field.key] ?? []}
                                    newRows={newRecord[field.key] ?? []}
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
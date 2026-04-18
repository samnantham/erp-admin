import React, { useRef } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, Table, Thead, Tbody, Tr, Th, Td, Badge,
    Text, Box, HStack, Button, Divider,
} from "@chakra-ui/react";
import { LuPrinter } from "react-icons/lu";
import { ArrayColumn, DisplayProp, DisplayPropBase } from "@/pages/CUDRequests/modules/types";
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

function diffArrayRows(oldRows: any[], newRows: any[], cols: ArrayColumn[]): DiffedRow[] {
    const keys = cols.map((c) => c.key);
    const remainingNew = newRows.map((r, i) => ({ row: r, originalIndex: i, matched: false }));
    const result: DiffedRow[] = [];

    for (const oldRow of oldRows) {
        const exactIdx = remainingNew.findIndex(
            (n) => !n.matched && keys.every((k) => String(n.row[k] ?? "") === String(oldRow[k] ?? ""))
        );
        if (exactIdx !== -1) {
            remainingNew[exactIdx].matched = true;
            result.push({ status: "unchanged", oldRow, newRow: remainingNew[exactIdx].row });
            continue;
        }
        const firstKey = keys[0];
        const partialIdx = remainingNew.findIndex(
            (n) => !n.matched && String(n.row[firstKey] ?? "") === String(oldRow[firstKey] ?? "")
        );
        if (partialIdx !== -1) {
            remainingNew[partialIdx].matched = true;
            result.push({ status: "modified", oldRow, newRow: remainingNew[partialIdx].row });
        } else {
            result.push({ status: "deleted", oldRow, newRow: null });
        }
    }
    for (const n of remainingNew) {
        if (!n.matched) result.push({ status: "added", oldRow: null, newRow: n.row });
    }
    return result;
}

const ROW_COLORS: Record<RowDiffStatus, { bg: string; badge: string; label: string }> = {
    added:     { bg: "green.50",  badge: "green",  label: "Added"    },
    deleted:   { bg: "red.50",    badge: "red",     label: "Deleted"  },
    modified:  { bg: "orange.50", badge: "orange",  label: "Modified" },
    unchanged: { bg: "white",     badge: "gray",    label: ""         },
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
        return (
            <Text fontSize="xs" fontWeight={isChanged ? "semibold" : "normal"}>
                {String(format(new Date(value), 'dd MMM yyyy'))}
            </Text>
        );
    }
    return <Text fontSize="xs" color="gray.700" fontWeight={isChanged ? "semibold" : "normal"}>{String(value)}</Text>;
};

// ================= Diff Array Field Renderer =================

const RenderArrayFieldDiff = ({
    label, field, oldRows, newRows,
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
            <HStack mb={2} spacing={2} flexWrap="wrap">
                <Text fontSize="sm" fontWeight="600" color="gray.600">{label}</Text>
                {addedCount    > 0 && <Badge colorScheme="green"  fontSize="xs">{addedCount} added</Badge>}
                {deletedCount  > 0 && <Badge colorScheme="red"    fontSize="xs">{deletedCount} deleted</Badge>}
                {modifiedCount > 0 && <Badge colorScheme="orange" fontSize="xs">{modifiedCount} modified</Badge>}
                {!hasChanges       && <Badge colorScheme="gray"   fontSize="xs">No changes</Badge>}
            </HStack>

            {diffed.length === 0 ? (
                <Text fontSize="sm" color="gray.400" py={4} textAlign="center">None</Text>
            ) : (
                <Box overflowX="auto" borderRadius="md" border="1px solid" borderColor="gray.200">
                    <Table size="sm" variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th w="28px">#</Th>
                                {cols.map((col, i) => (
                                    hasChanges ? (
                                        <Th key={`header-${col.key}-${i}`} colSpan={2} textAlign="center"
                                            borderLeft="1px solid" borderColor="gray.200" px={2}>
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
                                        <React.Fragment key={`sub-${col.key}-${i}`}>
                                            <Th fontSize="9px" color="red.500" borderLeft="1px solid"
                                                borderColor="gray.200" px={2} py={1} textTransform="uppercase">
                                                Current
                                            </Th>
                                            <Th fontSize="9px" color="green.600" px={2} py={1} textTransform="uppercase">
                                                New
                                            </Th>
                                        </React.Fragment>
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
                                                return (
                                                    <Td key={`simple-${col.key}-${colIdx}`}>
                                                        <RenderArrayCell col={col} value={oldVal ?? newVal} />
                                                    </Td>
                                                );
                                            }
                                            return (
                                                <React.Fragment key={`diff-${col.key}-${colIdx}`}>
                                                    <Td borderLeft="1px solid" borderColor="gray.200"
                                                        bg={status === "deleted" ? "red.100" : cellChanged ? "red.50" : undefined}
                                                        color={cellChanged || status === "deleted" ? "red.700" : undefined}
                                                        textDecoration={status === "deleted" ? "line-through" : undefined}>
                                                        {status === "added" ? (
                                                            <Text fontSize="xs" color="gray.300">—</Text>
                                                        ) : (
                                                            <RenderArrayCell col={col} value={oldVal} isChanged={cellChanged} />
                                                        )}
                                                    </Td>
                                                    <Td bg={status === "added" ? "green.100" : cellChanged ? "green.50" : undefined}
                                                        color={cellChanged || status === "added" ? "green.700" : undefined}>
                                                        {status === "deleted" ? (
                                                            <Text fontSize="xs" color="gray.300">—</Text>
                                                        ) : (
                                                            <RenderArrayCell col={col} value={newVal} isChanged={cellChanged} />
                                                        )}
                                                    </Td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <Td>
                                            {statusLabel && (
                                                <Badge colorScheme={badge} fontSize="xs">{statusLabel}</Badge>
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
    displayProps, isProcessing, onApprove, onReject, config,
}: PreviewChangesModalProps) => {

    const { openPreview } = usePDFPreview();
    const printRef = useRef<HTMLDivElement>(null);

    const previewConfig = config?.preview;

    const previewPDF = usePDFPreviewController({
        url: (previewRow && previewConfig?.getNewPreviewRequest?.(previewRow)?.url) || "",
        title: "Preview (Updated)",
    });

    if (!isOpen) return null;

    const oldRecord = previewRow?.old_data ?? {};
    const newRecord = previewRow?.new_data ?? {};

    const handleOldPreview = () => {
        if (!previewConfig?.getOldPreviewUrl) return;
        openPreview(previewConfig.getOldPreviewUrl(previewRow), "Preview", true);
    };

    const handleNewPreview = () => {
        if (!previewConfig?.getNewPreviewRequest) return;
        const req = previewConfig.getNewPreviewRequest(previewRow);
        if (!req?.body) return;
        previewPDF.open(req.body, "Preview (Updated)");
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=900,height=650");
        if (!printWindow || !printRef.current) return;

        const content = printRef.current.innerHTML;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview Changes</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }

                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        font-size: 10pt;
                        color: #000;
                        background: white;
                        padding: 10mm;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        margin-bottom: 12mm;
                    }

                    /* Repeat header row on every printed page */
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }

                    th, td {
                        border: 1px solid #bbb;
                        padding: 7pt 9pt;
                        font-size: 10pt;
                        line-height: 1.5;
                        word-break: break-word;
                        vertical-align: middle;
                    }

                    th {
                        background: #f0f0f0;
                        font-weight: 700;
                        text-align: left;
                        text-transform: uppercase;
                        font-size: 9pt;
                        letter-spacing: 0.03em;
                    }

                    tr { page-break-inside: avoid; }

                    tr.print-row-modified td { background: #fff7ed; }
                    tr.print-row-added    td { background: #f0fdf4; }
                    tr.print-row-deleted  td { background: #fef2f2; }

                    td.print-cell-old,
                    td.print-cell-old span { color: #b91c1c !important; }

                    td.print-cell-new,
                    td.print-cell-new span { color: #15803d !important; }

                    a, button { display: none !important; }

                    .chakra-badge {
                        display: inline-block;
                        padding: 1pt 5pt;
                        border-radius: 3pt;
                        font-size: 8pt;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const scalarProps = displayProps.filter((p) => !p.kind || p.kind === "scalar");
    const arrayProps  = displayProps.filter((p) => p.kind === "array") as Extract<DisplayProp, { kind: "array" }>[];

    const isChanged    = (key: string) => String(oldRecord[key] ?? "") !== String(newRecord[key] ?? "");
    const changedCount = scalarProps.filter((p) => isChanged(p.key)).length;
    const isPending    = previewRow?.status === "pending";

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxH="85vh" display="flex" flexDirection="column" overflow="hidden">

                {/* ── Header ── */}
                <ModalHeader fontSize="md" fontWeight="bold" flexShrink={0}
                    borderBottom="1px solid" borderColor="gray.200">
                    Preview Changes
                    {changedCount > 0 && (
                        <Badge ml={2} colorScheme="orange" fontSize="xs">
                            {changedCount} field{changedCount > 1 ? "s" : ""} modified
                        </Badge>
                    )}
                </ModalHeader>
                <ModalCloseButton />

                {/* ── Body (printable region) ── */}
                <ModalBody flex="1" overflowY="auto" overflowX="hidden" pb={4} px={4}>
                    <div id="preview-changes-printable" ref={printRef}>

                        {/* Scalar fields */}
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
                                                <Tr key={`${key}-${index}`} bg={changed ? "orange.50" : "white"}
                                                    className={changed ? "print-row-modified" : ""}>
                                                    <Td fontWeight="medium" color="gray.600">{label}</Td>
                                                    <Td color={changed ? "red.600" : "gray.700"}
                                                        className={changed ? "print-cell-old" : ""}>
                                                        <RenderCell value={oldRecord[key]} renderAs={renderAs} isChanged={changed} />
                                                    </Td>
                                                    <Td color={changed ? "green.600" : "gray.700"}
                                                        className={changed ? "print-cell-new" : ""}>
                                                        <RenderCell value={newRecord[key]} renderAs={renderAs} isChanged={changed} />
                                                    </Td>
                                                    <Td>
                                                        {changed && <Badge colorScheme="orange" fontSize="xs">Modified</Badge>}
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

                        {/* Array fields — diff view */}
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
                            <Text color="gray.500" textAlign="center" py={8}>No data available.</Text>
                        )}
                    </div>
                </ModalBody>

                {/* ── Footer ── */}
                <Box px={6} py={4} borderTop="1px solid" borderColor="gray.200"
                    bg="gray.50" borderBottomRadius="md" flexShrink={0}>
                    <HStack justify="space-between">
                        <Button size="sm" variant="solid" colorScheme="blue"
                            leftIcon={<LuPrinter />} onClick={handlePrint}>
                            Print
                        </Button>

                        {isPending && (
                            <HStack spacing={3}>
                                <Button size="sm" variant="solid" colorScheme="red"
                                    isLoading={isProcessing} onClick={onReject}>
                                    Reject
                                </Button>
                                <Button size="sm" colorScheme="green"
                                    isLoading={isProcessing} onClick={onApprove}>
                                    Approve
                                </Button>
                            </HStack>
                        )}
                    </HStack>
                </Box>

            </ModalContent>
        </Modal>
    );
};
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, Badge, VStack, Spinner, Center,
    Button, Box, HStack, Text, useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { DisplayProp } from "@/pages/UpdateDeleteRequests/modules/types";
import { PreviewChangesModal } from "./PreviewChangesModal";

// ================= Constants =================

const STATUS_COLOR: Record<string, string> = {
    pending: "yellow",
    approved: "green",
    rejected: "red",
};

// ================= Types =================

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    data: any[];
    isProcessing: boolean;
    displayProps: DisplayProp[];
    onApprove: (row: any) => void;
    onReject: (row: any) => void;
}

// ================= Component =================

export const HistoryModal = ({
    isOpen, onClose, isLoading, data,
    isProcessing, displayProps, onApprove, onReject,
}: HistoryModalProps) => {
    const previewDisc = useDisclosure();
    const [previewRow, setPreviewRow] = useState<any>(null);

    const openPreview = (item: any) => {
        setPreviewRow(item);
        previewDisc.onOpen();
    };

    const closePreview = () => {
        previewDisc.onClose();
        setPreviewRow(null);
    };

    return (
        <>
            <Modal
                isOpen={isOpen && !previewDisc.isOpen}
                onClose={onClose}
                size="xl"
                scrollBehavior="inside"
            >
                <ModalOverlay />
                <ModalContent
                    maxH="85vh"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                >
                    <ModalHeader
                        fontSize="md"
                        fontWeight="bold"
                        flexShrink={0}
                        borderBottom="1px solid"
                        borderColor="gray.200"
                    >
                        Request History
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody
                        flex="1"
                        overflowY="auto"
                        overflowX="hidden"
                        pb={6}
                    >
                        {isLoading ? (
                            <Center py={10}><Spinner /></Center>
                        ) : data.length === 0 ? (
                            <Text color="gray.500" textAlign="center" py={8}>
                                No history found.
                            </Text>
                        ) : (
                            <VStack spacing={3} align="stretch">
                                {data.map((item: any, index: number) => (
                                    <Box
                                        key={item.id ?? index}
                                        p={3}
                                        border="1px solid"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        bg="gray.50"
                                    >
                                        <HStack justify="space-between" mb={1}>
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                                                {item.model_name?.toUpperCase()} — {item.action?.toUpperCase()} Request
                                            </Text>
                                            <HStack spacing={2}>
                                                <Badge colorScheme={STATUS_COLOR[item.status] ?? "gray"}>
                                                    {item.status}
                                                </Badge>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    colorScheme="blue"
                                                    onClick={() => openPreview(item)}
                                                >
                                                    Preview Changes
                                                </Button>
                                            </HStack>
                                        </HStack>
                                        <HStack spacing={4}>
                                            <Text fontSize="xs" color="gray.500">
                                                By: <b>{item.requested_by ?? "—"}</b>
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                At: <b>{item.created_at ?? "—"}</b>
                                            </Text>
                                        </HStack>
                                        {item.reason && (
                                            <Text fontSize="xs" color="gray.500" mt={1}>
                                                Reason: <b>{item.reason}</b>
                                            </Text>
                                        )}
                                    </Box>
                                ))}
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* ── Preview Changes Modal ── */}
            <PreviewChangesModal
                isOpen={previewDisc.isOpen}
                onClose={closePreview}
                previewRow={previewRow}
                displayProps={displayProps}
                isProcessing={isProcessing}
                onApprove={() => {
                    closePreview();
                    onClose();
                    onApprove(previewRow);
                }}
                onReject={() => {
                    closePreview();
                    onClose();
                    onReject(previewRow);
                }}
            />
        </>
    );
};
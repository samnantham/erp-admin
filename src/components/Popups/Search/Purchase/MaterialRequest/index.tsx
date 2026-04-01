import { useEffect, useRef } from 'react';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { MaterialRequestSearch } from '@/components/SearchBars/Purchase/MaterialRequest';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPopupProps = {
  isOpen: boolean;
  /** Called with selected IDs on Apply, or empty array on X-close */
  onClose: (selectedIds: string[]) => void;
  data?: {
    request_ids?: (string | number)[];
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const MaterialRequestSearchPopup = ({ isOpen, onClose, data = {} }: ModalPopupProps) => {
  // Track the last applied selection so X-close returns it unchanged
  // (instead of wiping everything when the user accidentally clicks outside)
  const lastAppliedRef = useRef<string[]>([]);

  // Reset ref whenever modal opens fresh with new data
  useEffect(() => {
    if (isOpen) {
      lastAppliedRef.current = (data.request_ids ?? []).map(String);
    }
  }, [isOpen]);

  const handleApply = (selectedIds: string[]) => {
    lastAppliedRef.current = selectedIds;
    onClose(selectedIds);
  };

  const handleXClose = () => {
    // X button preserves whatever was last applied — doesn't clear the parent's value
    onClose(lastAppliedRef.current);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleXClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay />
      <ModalContent maxWidth="85vw">
        <ModalHeader textAlign="center">
          <Text fontSize="lg" fontWeight="bold">
            Search Material Request
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <MaterialRequestSearch
            mode="modal"
            initialSelectedIds={(data.request_ids ?? []).map(String)}
            onApply={handleApply}
            onClear={() => {
              lastAppliedRef.current = [];
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default MaterialRequestSearchPopup;
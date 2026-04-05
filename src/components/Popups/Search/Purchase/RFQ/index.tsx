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
import { PRFQSearch } from '@/components/SearchBars/Purchase/RFQ';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPopupProps = {
  isOpen: boolean;
  /** Called with selected IDs on Apply, or empty array on X-close */
  onClose: (selectedId: string) => void;
  data?: {
    prfq_id?: string;
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PRFQSearchPopup = ({ isOpen, onClose, data = {} }: ModalPopupProps) => {
  // Track the last applied selection so X-close returns it unchanged
  // (instead of wiping everything when the user accidentally clicks outside)
  const lastAppliedRef = useRef<string>('');

  // Reset ref whenever modal opens fresh with new data
  useEffect(() => {
    if (isOpen) {
      lastAppliedRef.current = data.prfq_id ?? '';
    }
  }, [isOpen]);

  const handleApply = (selectedId: string) => {
    lastAppliedRef.current = selectedId;
    onClose(selectedId);
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
          <PRFQSearch
            mode="modal"
            initialSelectedId={data.prfq_id ?? ''}
            onApply={handleApply}
            onClear={() => {
              lastAppliedRef.current = '';
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PRFQSearchPopup;
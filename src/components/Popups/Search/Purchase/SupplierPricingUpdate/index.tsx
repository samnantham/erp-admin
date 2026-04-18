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
import { SupplierPricingUpdateSearch } from '@/components/SearchBars/Purchase/SupplierPricingUpdate';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalPopupProps = {
  isOpen: boolean;
  /** Called with selected quotation ID on Apply, or last applied ID on X-close */
  onClose: (selectedId: string) => void;
  data?: {
    quotation_id?: string;
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SupplierPricingUpdateSearchPopup = ({
  isOpen,
  onClose,
  data = {},
}: ModalPopupProps) => {
  // Track the last applied selection so X-close returns it unchanged
  // (instead of wiping everything when the user accidentally clicks outside)
  const lastAppliedRef = useRef<string>('');

  // Reset ref whenever modal opens fresh with new data
  useEffect(() => {
    if (isOpen) {
      lastAppliedRef.current = data.quotation_id ?? '';
    }
  }, [isOpen]);

  const handleApply = (selectedId: string | null) => {
    lastAppliedRef.current = selectedId ?? '';
    onClose(selectedId ?? '');
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
            Search Quotation
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SupplierPricingUpdateSearch
            mode="modal"
            initialSelectedId={data.quotation_id ?? ''}
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

export default SupplierPricingUpdateSearchPopup;
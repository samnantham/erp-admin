import { Stack } from '@chakra-ui/react';
import { FieldInput } from '@/components/FieldInput';
import { CreateUpdateModal } from '@/components/ReUsable/CreateUpdateModal';
import { useSaveRoute } from '@/services/user-access/route/service';

export default function ModalForm({ isOpen, onClose, isEdit, existInfo }: any) {
  const saveEndpoint = useSaveRoute();

  return (
    <CreateUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Route"
      isEdit={isEdit}
      existInfo={existInfo}
      createMutation={saveEndpoint as any}
      updateMutation={saveEndpoint as any}
      invalidateKeys={['userRouteIndex', 'userRouteList']}
      fields={['name', 'path', 'module']}
    >
      <Stack spacing={4}>
      <FieldInput
        name="name"
        placeholder="Enter Route Name"
        required="Route name is required"
        defaultValue={existInfo?.name ?? ''}
      />
      <FieldInput
        name="path"
        placeholder="Enter Path  e.g. /inventory"
        required="Path is required"
        defaultValue={existInfo?.path ?? ''}
      />
      <FieldInput
        name="module"
        placeholder="Enter Module  e.g. Finance"
        required="Module is required"
        defaultValue={existInfo?.module ?? ''}
      />
      </Stack>
    </CreateUpdateModal>
  );
}
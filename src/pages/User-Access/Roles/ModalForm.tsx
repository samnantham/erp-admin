// src/pages/User-Access/Roles/ModalForm.tsx

import { FieldInput } from '@/components/FieldInput';
import { CreateUpdateModal } from '@/components/ReUsable/CreateUpdateModal';
import { useSaveRole } from '@/services/user-access/role/services';

export default function ModalForm({ isOpen, onClose, isEdit, existInfo }: any) {
  const saveEndpoint = useSaveRole();

  return (
    <CreateUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="User Role"
      isEdit={isEdit}
      existInfo={existInfo}
      createMutation={saveEndpoint as any}
      updateMutation={saveEndpoint as any}
      invalidateKeys={['userRoleIndex', 'userRoleList']}
      fields={['name']}
    >
      <FieldInput
        name="name"
        placeholder="Enter Role Name"
        required="Role name is required"
        defaultValue={existInfo?.name ?? ''}
      />
    </CreateUpdateModal>
  );
}
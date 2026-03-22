// src/pages/User-Access/Departments/ModalForm.tsx

import { FieldInput } from '@/components/FieldInput';
import { CreateUpdateModal } from '@/components/ReUsable/CreateUpdateModal';
import { useSaveDepartment } from '@/services/user-access/department/services';

export default function ModalForm({ isOpen, onClose, isEdit, existInfo }: any) {
  const saveEndpoint = useSaveDepartment();

  return (
    <CreateUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Department"
      isEdit={isEdit}
      existInfo={existInfo}
      createMutation={saveEndpoint as any}
      updateMutation={saveEndpoint as any}
      invalidateKeys={['userDepartmentIndex', 'userDepartmentList']}
      fields={['name']}
    >
      <FieldInput
        name="name"
        placeholder="Enter Department Name"
        required="Department name is required"
        defaultValue={existInfo?.name ?? ''}
      />
    </CreateUpdateModal>
  );
}
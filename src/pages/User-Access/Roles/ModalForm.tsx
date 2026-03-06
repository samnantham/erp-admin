import { FieldInput } from '@/components/FieldInput';
import { CreateUpdateModal } from '@/components/ReUsable/CreateUpdateModal';

import {
  useCreateRole,
  useUpdateRole,
} from '@/services/user-access/role/services';

import { BasicForm } from '@/types/global-types';

export default function ModalForm({
  isOpen,
  onClose,
  isEdit,
  existInfo,
}: any) {
  const createEndPoint = useCreateRole();
  const updateEndPoint = useUpdateRole();

  return (
    <CreateUpdateModal<BasicForm>
      isOpen={isOpen}
      onClose={onClose}
      title="User Role"
      isEdit={isEdit}
      existInfo={existInfo}
      createMutation={createEndPoint}
      updateMutation={updateEndPoint}
      invalidateKeys={['userRoleIndex', 'userRoleList']}
      fields={['name']} 
    >
      <FieldInput
        name="name"
        placeholder="Enter Role Name"
        required="Role name required"
        defaultValue={existInfo?.name ?? ''}
      />
    </CreateUpdateModal>
  );
}
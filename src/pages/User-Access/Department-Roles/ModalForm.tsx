// src/pages/User-Access/DepartmentRoles/ModalForm.tsx

import { CreateUpdateModal } from '@/components/ReUsable/CreateUpdateModal';
import { FieldSelect } from '@/components/FieldSelect';
import { useCreateDepartmentRole, usDepartmentRoleDropdowns } from '@/services/user-access/department-role/service';

export default function ModalForm({ isOpen, onClose, existInfo }: any) {
  const saveEndpoint = useCreateDepartmentRole();

  const { data: dropdownData }  = usDepartmentRoleDropdowns();

  const departments = dropdownData?.departments ?? [];
  const roles       = dropdownData?.roles ?? [];

  return (
    <CreateUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Department Role"
      isEdit={false}
      existInfo={existInfo}
      createMutation={saveEndpoint as any}
      updateMutation={saveEndpoint as any}
      invalidateKeys={['userDepartmentRoleIndex']}
      fields={['department_id', 'role_id']}
    >
      <FieldSelect
        name="department_id"
        placeholder="Select Department"
        required="Department is required"
        options={departments.map((d: any) => ({ label: d.name, value: d.id }))}
      />
      <FieldSelect
        name="role_id"
        placeholder="Select Role"
        required="Role is required"
        options={roles.map((r: any) => ({ label: r.name, value: r.id }))}
      />
    </CreateUpdateModal>
  );
}
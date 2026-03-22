// src/pages/User-Access/Permissions/ModalForm.tsx

import { CreateUpdateModal } from '@/components/ReUsable/CreateUpdateModal';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldCheckbox } from '@/components/FieldCheckbox';
import { useSavePermission } from '@/services/user-access/permission/service';
import { usDepartmentRoleDropdowns } from '@/services/user-access/department-role/service';

export default function ModalForm({ isOpen, onClose, isEdit, existInfo }: any) {
  const saveEndpoint = useSavePermission();

  const { data: dropdownData }    = usDepartmentRoleDropdowns();

  const departmentRoles = dropdownData?.departments ?? [];
  const routes          = dropdownData?.roles ?? [];

  return (
    <CreateUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Permission"
      isEdit={isEdit}
      existInfo={existInfo}
      createMutation={saveEndpoint as any}
      updateMutation={saveEndpoint as any}
      invalidateKeys={['userPermissionIndex']}
      fields={['department_role_id', 'route_id', 'create_access', 'read_access', 'update_access', 'delete_access']}
    >
      <FieldSelect
        name="department_role_id"
        placeholder="Select Department Role"
        required="Department role is required"
        isDisabled={isEdit}
        defaultValue={existInfo?.department_role_id ?? ''}
        options={departmentRoles.map((dr: any) => ({
          label: `${dr.department?.name} — ${dr.role?.name}`,
          value: dr.id,
        }))}
      />
      <FieldSelect
        name="route_id"
        placeholder="Select Route"
        required="Route is required"
        isDisabled={isEdit}
        defaultValue={existInfo?.route_id ?? ''}
        options={routes.map((r: any) => ({
          label: `${r.module} / ${r.name}`,
          value: r.id,
        }))}
      />
      <FieldCheckbox name="create_access" label="Create" defaultChecked={existInfo?.create_access ?? false} />
      <FieldCheckbox name="read_access"   label="Read"   defaultChecked={existInfo?.read_access   ?? false} />
      <FieldCheckbox name="update_access" label="Update" defaultChecked={existInfo?.update_access ?? false} />
      <FieldCheckbox name="delete_access" label="Delete" defaultChecked={existInfo?.delete_access ?? false} />
    </CreateUpdateModal>
  );
}
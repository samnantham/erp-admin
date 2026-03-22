// src/services/user-access/permission/services.ts

import { useQuery }        from 'react-query';
import { getRequest, postRequest } from '@/api/client';
import { endPoints }       from '@/api/endpoints';
import { useApiMutation }  from '@/api/hooks/useApiMutation';
import { zCreatePayload, CreatePayload } from '@/services/global-schema';
import { zPermissionPayload } from './schema';

/* ================= Permissions by DepartmentRole ================= */

export const usePermissionsByDeptRole = (department_role_id?: string) =>
  useQuery({
    queryKey: ['permissionsByDeptRole', department_role_id],
    queryFn:  () =>
      getRequest(
        endPoints.permission.byDeptRole.replace(':id', String(department_role_id)),
        zPermissionPayload
      ),
    enabled:  !!department_role_id,
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Save Permissions Variables ================= */

export interface SavePermissionVariables {
  id:        string;
  route_ids: string[];
}

/* ================= Save Permissions for DepartmentRole ================= */

export const useSavePermissionsForDeptRole = () =>
  useApiMutation<CreatePayload, SavePermissionVariables>(({ id, ...rest }) =>
    postRequest(
      endPoints.permission.saveForDeptRole.replace(':id', id),
      rest,
      zCreatePayload
    )
  );
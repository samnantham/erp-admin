// src/services/user-access/department-role/services.ts

import { useQuery } from 'react-query';
import { getRequest, postRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useApiMutation } from '@/api/hooks/useApiMutation';
import {
    QueryParams, zDropdownPayload,
    DropdownPayload, zCreatePayload, CreatePayload, zIndexPayload, zDetailsPayload
} from '@/services/global-schema';


/* ================= DepartmentRole Index ================= */

export const useDepartmentRoleIndex = (queryParams?: QueryParams) =>
    useQuery({
        queryKey: ['userDepartmentRoleIndex', queryParams],
        queryFn: () => getRequest(endPoints.index.departmentRole, zIndexPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= DepartmentRole Details ================= */

export const useDepartmentRoleDetails = (id?: string) =>
    useQuery({
        queryKey: ['userDepartmentRoleDetails', id],
        queryFn: () => getRequest(endPoints.info.departmentRole.replace(':id', String(id)), zDetailsPayload),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= DepartmentRole Variables ================= */

export interface DepartmentRoleVariables {
    department_id: string;
    role_id?: string;
    role_ids?: string[];
}

/* ================= Create DepartmentRole ================= */
// No update — delete and recreate instead

export const useCreateDepartmentRole = () =>
    useApiMutation<CreatePayload, DepartmentRoleVariables>((vars) =>
        postRequest(endPoints.create.departmentRole, vars, zCreatePayload)
    );

/* ================= Dropdowns for DepartmentRole ================= */
// No update — delete and recreate instead

export const usDepartmentRoleDropdowns = () =>
    useQuery<DropdownPayload>({
        queryKey: ['departmentRoleDropdowns'],
        queryFn: () =>
            getRequest(
                endPoints.drop_downs.department_role,
                zDropdownPayload
            ),
        retry: 2,
        refetchOnWindowFocus: false,
    });
// src/pages/User-Access/Departments/MapRolesModal.tsx

import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter,
    Button, VStack, HStack, Text,
    Spinner, Checkbox, useToast,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { Formiz, useForm } from '@formiz/core';
import { useCreateDepartmentRole } from '@/services/user-access/department-role/service';
import { useRoleIndex } from '@/services/user-access/role/services';
import { DataColumn } from '@/services/user-access/department/schema';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    department: DataColumn | null;
};

export function MapRolesModal({ isOpen, onClose, department }: Props) {
    const toast = useToast();
    const qc = useQueryClient();

    const { data: roleData, isLoading: roleLoading } = useRoleIndex({ is_fixed: false });
    const allRoles = roleData?.data ?? [];

    // already mapped role ids from department data
    const alreadyMappedIds = useMemo(
        () => new Set((department?.roles ?? []).map((r) => r.role_id)),
        [department]
    );

    // only track newly checked ids (not already mapped ones)
    const [checkedRoleIds, setCheckedRoleIds] = useState<Set<string>>(new Set());

    const createEndpoint = useCreateDepartmentRole();

    const form = useForm({
        // in MapRolesModal — replace onValidSubmit

        onValidSubmit: () => {
            if (!department?.id || checkedRoleIds.size === 0) return;

            createEndpoint.mutate(
                {
                    department_id: String(department.id),
                    role_ids: [...checkedRoleIds],   // send all at once
                },
                {
                    onSuccess: () => {
                        qc.invalidateQueries(['userDepartmentIndex']);
                        qc.invalidateQueries(['userDepartmentList']);
                        onClose();
                    },
                    onError: (err: any) => {
                        toast({
                            title: err?.response?.data?.message ?? 'Failed to map roles',
                            status: 'error',
                            duration: 3000,
                        });
                    },
                }
            );
        },
    });

    const handleToggle = (roleId: string) => {
        // can't toggle already mapped roles
        if (alreadyMappedIds.has(roleId)) return;
        setCheckedRoleIds((prev) => {
            const next = new Set(prev);
            next.has(roleId) ? next.delete(roleId) : next.add(roleId);
            return next;
        });
    };

    // save enables only when at least one new role is checked
    const isChanged = checkedRoleIds.size > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} closeOnEsc={false}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Map Roles —{' '}
                    <Text as="span" color="brand.500" fontWeight="600">
                        {department?.name ?? ''}
                    </Text>
                </ModalHeader>
                <ModalCloseButton />

                <Formiz autoForm connect={form}>
                    <ModalBody pb={4}>
                        {roleLoading ? (
                            <HStack justify="center" py={6}>
                                <Spinner size="sm" />
                                <Text fontSize="sm" color="gray.500">Loading roles...</Text>
                            </HStack>
                        ) : allRoles.length === 0 ? (
                            <Text fontSize="sm" color="gray.400" textAlign="center" py={6}>
                                No roles available.
                            </Text>
                        ) : (
                            <VStack align="stretch" spacing={2}>
                                {allRoles.map((role: any) => {
                                    const isAlreadyMapped = alreadyMappedIds.has(role.id);
                                    const isChecked = isAlreadyMapped || checkedRoleIds.has(role.id);

                                    return (
                                        <HStack
                                            key={role.id}
                                            px={3} py={2}
                                            borderRadius="md"
                                            border="1px solid"
                                            borderColor={isChecked ? 'blue.300' : 'gray.200'}
                                            bg={isChecked ? 'blue.50' : 'transparent'}
                                            _dark={{
                                                borderColor: isChecked ? 'blue.400' : 'gray.600',
                                                bg: isChecked ? 'blue.900' : 'transparent',
                                            }}
                                            cursor={isAlreadyMapped ? 'default' : 'pointer'}
                                            onClick={() => handleToggle(role.id)}
                                        >
                                            <Checkbox
                                                isChecked={isChecked}
                                                isDisabled={isAlreadyMapped}
                                                onChange={() => handleToggle(role.id)}
                                                pointerEvents="none"
                                            />
                                            <Text fontSize="sm" flex={1}>{role.name}</Text>
                                            {isAlreadyMapped && (
                                                <Text fontSize="xs" color="gray.400">Already mapped</Text>
                                            )}
                                            {role.is_super_admin && (
                                                <Text fontSize="xs" color="purple.500" fontWeight="500">
                                                    Super Admin
                                                </Text>
                                            )}
                                        </HStack>
                                    );
                                })}
                            </VStack>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            type="submit"
                            colorScheme="brand"
                            mr={3}
                            isLoading={createEndpoint.isLoading}
                            isDisabled={roleLoading || createEndpoint.isLoading || !isChanged}
                        >
                            Save
                        </Button>
                        <Button onClick={onClose} isDisabled={createEndpoint.isLoading}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Formiz>
            </ModalContent>
        </Modal>
    );
}

export default MapRolesModal;
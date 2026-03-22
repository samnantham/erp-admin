import { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Stack, HStack, Heading, Text, Button,
  VStack, Checkbox, Badge, Spinner, Divider
} from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';
import { SlideIn } from '@/components/SlideIn';
import {
  usePermissionsByDeptRole,
  useSavePermissionsForDeptRole,
} from '@/services/user-access/permission/service';
import { useRouterContext } from '@/services/auth/RouteContext';

export const PermissionPage = () => {
  const { id }    = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate  = useNavigate();

  const { otherPermissions } = useRouterContext();
  const canUpdate = otherPermissions.update === 1;

  const roleName       = state?.role_name       ?? 'Role';
  const departmentName = state?.department_name ?? 'Department';

  const { data, isLoading } = usePermissionsByDeptRole(id);
  const modules             = data?.data ?? [];

  const initialGranted = useMemo(() => {
    const ids = new Set<string>();
    modules.forEach((m) =>
      m.routes.forEach((r) => { if (r.is_granted) ids.add(r.id); })
    );
    return ids;
  }, [data]);

  const [checkedIds, setCheckedIds]   = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && data && !initialized) {
      setCheckedIds(new Set(initialGranted));
      setInitialized(true);
    }
  }, [isLoading, data, initialized, initialGranted]);

  const isChanged = useMemo(() => {
    if (checkedIds.size !== initialGranted.size) return true;
    for (const id of checkedIds) {
      if (!initialGranted.has(id)) return true;
    }
    return false;
  }, [checkedIds, initialGranted]);

  const saveEndpoint = useSavePermissionsForDeptRole();

  const handleToggle = (routeId: string) => {
    if (!canUpdate) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(routeId) ? next.delete(routeId) : next.add(routeId);
      return next;
    });
  };

  const handleToggleModule = (moduleRouteIds: string[]) => {
    if (!canUpdate) return;
    const allCheckedInModule = moduleRouteIds.every((id) => checkedIds.has(id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (allCheckedInModule) {
        moduleRouteIds.forEach((id) => next.delete(id));
      } else {
        moduleRouteIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!id) return;
    saveEndpoint.mutate(
      { id, route_ids: [...checkedIds] },
      { onSuccess: () => navigate('/user-access/departments') }
    );
  };

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>

        {/* ── Header ── */}
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Button
              variant="ghost"
              leftIcon={<LuArrowLeft />}
              onClick={() => navigate('/user-access/departments')}
              size="sm"
            >
              Back
            </Button>
            <Box>
              <Heading as="h4" size="md">Permissions</Heading>
              <HStack spacing={2} mt={1}>
                <Badge colorScheme="purple" variant="subtle">{departmentName}</Badge>
                <Text fontSize="xs" color="gray.400">—</Text>
                <Badge colorScheme="blue" variant="subtle">{roleName}</Badge>
              </HStack>
            </Box>
          </HStack>

          {/* Save button — hidden if no update permission */}
          {canUpdate && (
            <Button
              colorScheme="brand"
              isLoading={saveEndpoint.isLoading}
              isDisabled={isLoading || saveEndpoint.isLoading || !isChanged}
              onClick={handleSave}
            >
              Save Permissions
            </Button>
          )}
        </HStack>

        {/* ── Content ── */}
        <Box
          borderRadius={8}
          border="1px solid"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.600' }}
          p={4}
        >
          {isLoading ? (
            <HStack justify="center" py={10}>
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.500">Loading permissions...</Text>
            </HStack>
          ) : modules.length === 0 ? (
            <Text fontSize="sm" color="gray.400" textAlign="center" py={10}>
              No routes available. Please seed routes first.
            </Text>
          ) : (
            <VStack align="stretch" spacing={6}>
              {modules.map((moduleGroup) => {
                const moduleRouteIds  = moduleGroup.routes.map((r) => r.id);
                const checkedInModule = moduleRouteIds.filter((id) => checkedIds.has(id)).length;
                const allInModule     = checkedInModule === moduleRouteIds.length;
                const someInModule    = checkedInModule > 0 && !allInModule;

                return (
                  <Box key={moduleGroup.module}>
                    {/* ── Module header ── */}
                    <HStack
                      px={3} py={2}
                      bg="gray.50"
                      _dark={{ bg: 'gray.700' }}
                      borderRadius="md"
                      mb={2}
                      cursor={canUpdate ? 'pointer' : 'default'}
                      onClick={() => handleToggleModule(moduleRouteIds)}
                    >
                      <Checkbox
                        isChecked={allInModule}
                        isIndeterminate={someInModule}
                        onChange={() => handleToggleModule(moduleRouteIds)}
                        pointerEvents="none"
                        isReadOnly={!canUpdate}
                      />
                      <Text fontWeight="600" fontSize="sm">{moduleGroup.module}</Text>
                      <Badge colorScheme="gray" variant="subtle" ml="auto">
                        {checkedInModule} / {moduleRouteIds.length}
                      </Badge>
                    </HStack>

                    {/* ── Routes ── */}
                    <VStack align="stretch" spacing={1} pl={4}>
                      {moduleGroup.routes.map((route) => {
                        const isChecked = checkedIds.has(route.id);
                        return (
                          <HStack
                            key={route.id}
                            px={3} py={2}
                            borderRadius="md"
                            border="1px solid"
                            borderColor={isChecked ? 'blue.200' : 'gray.100'}
                            bg={isChecked ? 'blue.50' : 'transparent'}
                            _dark={{
                              borderColor: isChecked ? 'blue.600' : 'gray.700',
                              bg:          isChecked ? 'blue.900' : 'transparent',
                            }}
                            cursor={canUpdate ? 'pointer' : 'default'}
                            onClick={() => handleToggle(route.id)}
                          >
                            <Checkbox
                              isChecked={isChecked}
                              onChange={() => handleToggle(route.id)}
                              pointerEvents="none"
                              isReadOnly={!canUpdate}
                            />
                            <Text fontSize="sm" flex={1}>{route.name}</Text>
                            <Text fontSize="xs" color="gray.400" fontFamily="mono">
                              {route.path}
                            </Text>
                          </HStack>
                        );
                      })}
                    </VStack>

                    <Divider mt={4} />
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>

      </Stack>
    </SlideIn>
  );
};

export default PermissionPage;
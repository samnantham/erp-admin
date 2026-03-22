import { useState } from 'react';
import { Box, HStack, Heading, Stack, Badge, Wrap, WrapItem, Tooltip } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import { DataTable } from '@/components/DataTable';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { getBaseColumns } from '@/components/ReUsable/table-columns/baseColumns';
import { getStatusColumn } from '@/components/ReUsable/table-columns/statusColumn';
import { getDeletedColumn } from '@/components/ReUsable/table-columns/deletedColumn';
import { ActionsHeader } from '@/components/ReUsable/table-columns/BasicTableActions';

import ModalForm from '@/pages/User-Access/Departments/ModalForm';
import MapRolesModal from '@/pages/User-Access/Departments/MapRolesModal';
import { useDepartmentIndex } from '@/services/user-access/department/services';
import { DataColumn } from '@/services/user-access/department/schema';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';
import { useRouterContext } from '@/services/auth/RouteContext';

import {
  Button, Menu, MenuButton, MenuList, MenuItem,
  HStack as ChakraHStack,
} from '@chakra-ui/react';
import { EditIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { TbTrash, TbTrashX } from 'react-icons/tb';
import { LuRefreshCw, LuLink } from 'react-icons/lu';

type ConfirmMode = null | 'soft' | 'restore' | 'permanent';

export const DepartmentList = () => {
  const { otherPermissions } = useRouterContext();

  const canCreate = otherPermissions.create === 1;
  const canUpdate = otherPermissions.update === 1;
  const canDelete = otherPermissions.update === 1;

  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const [isOpen, toggleModal]   = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEdit, toggleEdit]    = useState(false);
  const [queryParams, setQueryParams] = useState<any>({ status: 'all' });
  const [refreshKey, setRefreshKey]   = useState(0);
  const [sortBy, setSortBy]           = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm]   = useState('');

  const [isMapRolesOpen, setMapRolesOpen]   = useState(false);
  const [mapRolesTarget, setMapRolesTarget] = useState<DataColumn | null>(null);

  const [mutatingRowId, setMutatingRowId] = useState<any>(null);
  const [confirmMode, setConfirmMode]     = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem]       = useState<DataColumn | null>(null);

  const openModal = (item: any, editStatus?: boolean) => {
    setSelected(item);
    toggleModal(true);
    toggleEdit(!!editStatus);
  };

  const closeModal = () => {
    queryClient.invalidateQueries(['userDepartmentIndex']);
    setRefreshKey((prev) => prev + 1);
    refreshData();
    setSelected(null);
    toggleEdit(false);
    toggleModal(false);
  };

  const openMapRoles  = (item: DataColumn) => { setMapRolesTarget(item); setMapRolesOpen(true); };
  const closeMapRoles = () => {
    queryClient.invalidateQueries(['userDepartmentIndex']);
    setRefreshKey((prev) => prev + 1);
    refreshData();
    setMapRolesTarget(null);
    setMapRolesOpen(false);
  };

  const { data: itemList, isLoading: listLoading, refetch: refreshData } =
    useDepartmentIndex(queryParams);
  const data = itemList?.data ?? [];

  const deleteEndpoint = useDelete({
    url: endPoints.delete.department,
    invalidate: ['userDepartmentIndex', 'userDepartmentList'],
  });

  const mutateDepartment = (item: DataColumn) => {
    setMutatingRowId(item.id);
    deleteEndpoint.mutate(
      { id: item.id },
      {
        onSuccess: () => { closeConfirm(); setMutatingRowId(null); },
        onError:   () => { setMutatingRowId(null); },
      }
    );
  };

  const openSoft      = (item: DataColumn) => { setActiveItem(item); setConfirmMode('soft'); };
  const openRestore   = (item: DataColumn) => { setActiveItem(item); setConfirmMode('restore'); };
  const openPermanent = (item: DataColumn) => { setActiveItem(item); setConfirmMode('permanent'); };
  const closeConfirm  = () => { setConfirmMode(null); setActiveItem(null); };

  const columnHelper = createColumnHelper<DataColumn>();

  // ── Roles column ───────────────────────────────────────────────
  const rolesColumn = columnHelper.display({
    id: 'roles',
    header: 'Mapped Roles',
    cell: (info) => {
      const roles = info.row.original.roles ?? [];
      if (roles.length === 0) {
        return <Badge colorScheme="gray" variant="subtle">No roles</Badge>;
      }
      return (
        <Wrap spacing={1}>
          {roles.map((role) => (
            <WrapItem key={role.department_role_id}>
              <Tooltip
                label={`Click here to assign permissions for ${role.name}`}
                hasArrow placement="top"
                bg="green.500" color="white"
                boxShadow="lg" borderRadius="md" px={3} py={2}
              >
                <Badge
                  colorScheme="blue" variant="subtle" cursor="pointer"
                  px={2} py={1} borderRadius="md"
                  _hover={{ opacity: 0.8, textDecoration: 'underline' }}
                  onClick={() =>
                    navigate(`/user-access/permissions/${role.department_role_id}`, {
                      state: {
                        id: role.department_role_id,
                        role_name: role.name,
                        department_name: info.row.original.name,
                      },
                    })
                  }
                >
                  {role.name}
                </Badge>
              </Tooltip>
            </WrapItem>
          ))}
        </Wrap>
      );
    },
  });

  // ── Action column ──────────────────────────────────────────────
  const actionColumn = columnHelper.display({
    id: 'actions',
    header: () => <ActionsHeader />,
    cell: (info) => {
      const item    = info.row.original;
      const isBusy  = mutatingRowId === item.id && deleteEndpoint.isLoading;
      const disabled = isBusy || !!item.is_fixed;

      // No actions available at all — don't render the menu
      if (!canUpdate && !canDelete) return null;

      return (
        <ChakraHStack>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              bg="#0C2556"
              color="white"
              _hover={{ color: '#0C2556', bg: '#fff' }}
              _active={{ color: '#0C2556', bg: '#fff' }}
              rightIcon={<ChevronDownIcon />}
              isDisabled={isBusy || item.is_fixed === true}
            >
              Actions
            </MenuButton>

            <MenuList width="160px" maxW="160px" minW="160px" boxShadow="md" sx={{ overflow: 'hidden', p: '4px' }}>
              {item.deleted_at === null ? (
                <>
                  {/* Edit — shown only if canUpdate */}
                  {canUpdate && (
                    <MenuItem
                      icon={<EditIcon fontSize="1rem" />}
                      onClick={() => openModal(item, true)}
                      isDisabled={disabled}
                    >
                      Edit
                    </MenuItem>
                  )}
                  {/* Map Roles — shown only if canUpdate */}
                  {canUpdate && (
                    <MenuItem
                      icon={<LuLink fontSize="1rem" />}
                      onClick={() => openMapRoles(item)}
                      isDisabled={disabled}
                    >
                      Map Roles
                    </MenuItem>
                  )}
                  {/* Soft Delete — shown only if canDelete */}
                  {canDelete && (
                    <MenuItem
                      icon={<TbTrash fontSize="1rem" />}
                      onClick={() => openSoft(item)}
                      isDisabled={disabled}
                      color="red.500"
                    >
                      Soft Delete
                    </MenuItem>
                  )}
                </>
              ) : (
                <>
                  {/* Restore — shown only if canUpdate */}
                  {canUpdate && (
                    <MenuItem
                      icon={<LuRefreshCw fontSize="1rem" />}
                      onClick={() => openRestore(item)}
                      isDisabled={disabled}
                      color="green.500"
                    >
                      Restore
                    </MenuItem>
                  )}
                  {/* Permanent Delete — shown only if canDelete */}
                  {canDelete && (
                    <MenuItem
                      icon={<TbTrashX fontSize="1rem" />}
                      onClick={() => openPermanent(item)}
                      isDisabled={disabled}
                      color="red.600"
                      display="none"
                    >
                      Delete
                    </MenuItem>
                  )}
                </>
              )}
            </MenuList>
          </Menu>
        </ChakraHStack>
      );
    },
  });

  const baseColumns = getBaseColumns<DataColumn>();

  const columns =
    queryParams.status === 'trashed'
      ? [
          ...baseColumns.filter((col: any) => col.id === 'sNo' || col.id === 'name'),
          getStatusColumn<DataColumn>(),
          getDeletedColumn<DataColumn>(),
          actionColumn,
        ]
      : [
          ...baseColumns,
          rolesColumn,
          getStatusColumn<DataColumn>(),
          actionColumn,
        ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify="space-between">
          <Heading as="h4" size="md">User Access - Department</Heading>
          {canCreate && (
            <ResponsiveIconButton
              variant="@primary"
              icon={<LuPlus />}
              size={{ base: 'sm', md: 'md' }}
              onClick={() => openModal(null, false)}
            >
              Add New
            </ResponsiveIconButton>
          )}
        </HStack>

        <Box borderRadius={4}>
          <DataTable
            columns={columns}
            data={data}
            sortBy={sortBy}
            key={refreshKey}
            sortDirection={sortDirection}
            onSortChange={(id, dir) => { setSortBy(id); setSortDirection(dir); }}
            searchValue={searchTerm}
            enableClientSideSearch={true}
            loading={listLoading}
            onSearchChange={setSearchTerm}
            title="Department List"
            statusTabsStatus={true}
            status={queryParams.status}
            onStatusChange={(next) => setQueryParams((p: any) => ({ ...p, status: next }))}
            searchPlaceholder="Search Department"
          />

          <ModalForm
            key={selected?.id ?? 'create'}
            isOpen={isOpen}
            onClose={closeModal}
            existInfo={selected}
            isEdit={isEdit}
          />

          <MapRolesModal
            key={mapRolesTarget?.id ?? 'map-roles'}
            isOpen={isMapRolesOpen}
            onClose={closeMapRoles}
            department={mapRolesTarget}
          />

          <ConfirmationPopup
            isOpen={confirmMode !== null}
            onClose={closeConfirm}
            onConfirm={() => {
              if (!activeItem) return;
              if (confirmMode === 'restore')   openRestore(activeItem);
              if (confirmMode === 'soft')      mutateDepartment(activeItem);
              if (confirmMode === 'permanent') mutateDepartment(activeItem);
            }}
            isLoading={!!activeItem && mutatingRowId === activeItem.id && deleteEndpoint.isLoading}
            headerText={confirmMode === 'restore' ? 'Restore !!' : 'Delete !!'}
            bodyText={
              confirmMode === 'restore'
                ? 'Are you sure want to restore this department?'
                : 'Are you sure want to delete this department?'
            }
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default DepartmentList;
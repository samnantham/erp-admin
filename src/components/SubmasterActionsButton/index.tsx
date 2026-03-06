// components/SubmasterActionsButton.tsx
import { EditIcon } from '@chakra-ui/icons';
import {
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { LuRefreshCw, LuEye } from 'react-icons/lu';
import { TbTrash, TbTrashX } from 'react-icons/tb';
import { ChevronDownIcon } from '@chakra-ui/icons';

export type BaseRowShape = {
  id: number;
  is_fixed?: boolean | null;
  deleted_at?: string | null;
};

type Props<T extends BaseRowShape> = {
  item: T;
  isBusy?: boolean;
  disableAll?: boolean;
  hasView?: boolean;
  onEdit: (item: T) => void;
  onView?: (item: T) => void;
  onAskSoftDelete: (item: T) => void;
  onAskRestore: (item: T) => void;
  onAskPermanentDelete: (item: T) => void;
};

function SubMasterActions<T extends BaseRowShape>({
  item,
  isBusy = false,
  disableAll = false,
  hasView = false,
  onEdit,
  onView,
  onAskSoftDelete,
  onAskRestore,
  onAskPermanentDelete,
}: Props<T>) {
  const { is_fixed, deleted_at } = item;
  const disabled = disableAll || isBusy || !!is_fixed;

  return (
    <HStack>
      <Menu>
        <MenuButton
          as={Button}
          size="sm"
          bg="#0C2556"
          color="white"
          _hover={{ color: '#0C2556', bg: '#fff' }}
          _active={{ color: '#0C2556', bg: '#fff' }}
          rightIcon={<ChevronDownIcon />}
          isDisabled={disableAll || isBusy}

        >
          Actions
        </MenuButton>

        <MenuList width="150px"
          maxW="150px"
          minW="150px"
          boxShadow="md"
          sx={{ overflow: 'hidden', p: '4px' }}>
          {deleted_at === null ? (
            <>
              <MenuItem
                icon={<EditIcon fontSize="1rem" />}
                width="170px"
                onClick={() => onEdit(item)}
                isDisabled={disabled}
              >
                Edit
              </MenuItem>

              {hasView && (
                <MenuItem
                  icon={<LuEye fontSize="1rem" />}
                  width="170px"
                  onClick={() => onView?.(item)}
                  isDisabled={disabled}
                >
                  View
                </MenuItem>
              )}

              <MenuItem
                icon={<TbTrash fontSize="1rem" />}
                width="170px"
                onClick={() => onAskSoftDelete(item)}
                isDisabled={disabled}
                color="red.500"
              >
                Soft Delete
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem
                icon={<LuRefreshCw fontSize="1rem" />}
                width="170px"
                onClick={() => onAskRestore(item)}
                isDisabled={disabled}
                color="green.500"
              >
                Restore
              </MenuItem>

              {hasView && (
                <MenuItem
                  icon={<LuEye fontSize="1rem" />}
                  onClick={() => onView?.(item)}
                  isDisabled={disabled}
                >
                  View
                </MenuItem>
              )}

              <MenuItem
                icon={<TbTrashX fontSize="1rem" />}
                onClick={() => onAskPermanentDelete(item)}
                isDisabled={disabled}
                color="red.600"
              >
                Delete
              </MenuItem>
            </>
          )}
        </MenuList>
      </Menu>
    </HStack>
  );
}

export const ActionsHeader = () => (
  <Text textAlign="end">Actions</Text>
);

export default SubMasterActions;

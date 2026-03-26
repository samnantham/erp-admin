import { FC, useEffect, useRef } from 'react';

import {
  Avatar,
  Box,
  BoxProps,
  Link as ChakraLink,
  CloseButton,
  Collapse,
  Drawer,
  DrawerContent,
  Flex,
  FlexProps,
  HStack,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import Axios from 'axios';
import { IconType } from 'react-icons';
import { HiMiniWrenchScrewdriver } from 'react-icons/hi2';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaCog,
  FaGlobeAmericas,
  FaHome,
  FaUserFriends,
  FaUsers,
  FaUsersCog,
  FaClipboardList,
  FaRulerCombined,
  FaNotesMedical,
  FaShoppingBag,
  FaClipboardCheck
} from 'react-icons/fa';
import {
  FaBox,
  FaBoxOpen,
  FaBriefcase,
  FaBuildingUser,
  FaCreditCard,
  FaDollarSign,
  FaFlag,
  FaLayerGroup,
  FaPlane,
  FaSailboat,
  FaShip,
  FaTableList,
  FaTruck,
  FaUserPlus,
  FaUserShield,
  FaUsersGear,
  FaWarehouse,
  FaWrench,
  FaReceipt,
  FaRankingStar,
  FaChartLine,
} from 'react-icons/fa6';
import { PiListNumbersFill } from 'react-icons/pi';
import { BiSitemap } from 'react-icons/bi';
import { FiBell, FiChevronDown, FiMenu } from 'react-icons/fi';
import { LuBarcode } from 'react-icons/lu';
import { useQueryClient } from 'react-query';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useState } from 'react';

import { PasswordUpdateModal } from '@/components/Popups/PasswordUpdate';
import { ProfileUpdateModal } from '@/components/Popups/ProfileUpdate';
import { useAuthContext } from '@/services/auth/AuthContext';
import { useUserContext } from '@/services/auth/UserContext';
import { useProfileInfo } from '@/services/profile/services';

interface SectionProps {
  sectionName: string;
  items: LinkItemProps[];
}

interface LinkItemProps {
  name: string;
  icon: IconType;
  link?: string;
  activeBase?: string;
  state?: any;
  subItems?: LinkItemProps[];
}

interface MobileProps extends FlexProps {
  onOpen: () => void;
  userInfo?: any;
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
  permissions: string[];
  isSuperAdmin: boolean;
}

const NavigationSections: Array<SectionProps> = [
  {
    sectionName: 'Dashboard',
    items: [
      { name: 'Dashboard', icon: FaHome, link: '/' },
      {
        name: 'User Access',
        icon: FaUsersGear,
        subItems: [
          { icon: FaBuildingUser, link: '/user-access/roles', name: 'User Roles' },
          { icon: FaTableList, link: '/user-access/departments', name: 'Departments' },
          { icon: FaUserPlus, link: '/user-access/admin-users', name: 'Admin Users' },
          { icon: FaNotesMedical, link: '/user-access/pages', name: 'Pages/Routes' },
        ],
      },
    ],
  },
  {
    sectionName: "Master's Menu",
    items: [
      {
        name: 'Submaster',
        icon: FaUserShield,
        subItems: [
          { name: 'Bin Location', icon: FaBoxOpen, link: '/submaster/bin-locations' },
          { name: 'Business Type', icon: FaBriefcase, link: '/submaster/business-types' },
          { name: 'Conditions', icon: FaCheckCircle, link: '/submaster/conditions' },
          { name: 'Contact Type', icon: FaUserFriends, link: '/submaster/contact-types' },
          { name: 'Currency', icon: FaDollarSign, link: '/submaster/currencies' },
          { name: 'Custom Entry', icon: FaGlobeAmericas, link: '/submaster/custom-entries' },
          { name: 'FOB', icon: FaWarehouse, link: '/submaster/fobs' },
          { name: 'HSC Code', icon: LuBarcode, link: '/submaster/hsc-codes' },
          { name: 'Mode of Receipt', icon: FaReceipt, link: '/submaster/mode-of-receipts' },
          { name: 'Package Type', icon: FaBox, link: '/submaster/package-types' },
          { name: 'Payment Mode', icon: FaCreditCard, link: '/submaster/payment-modes' },
          { name: 'Payment Terms', icon: FaCalendarAlt, link: '/submaster/payment-terms' },
          { name: 'Priorities', icon: FaFlag, link: '/submaster/priorities' },
          { name: 'Rack', icon: FaLayerGroup, link: '/submaster/racks' },
          { name: 'Ship Accounts', icon: FaShip, link: '/submaster/ship-accounts' },
          { name: 'Ship Modes', icon: FaTruck, link: '/submaster/ship-modes' },
          { name: 'Ship Type', icon: FaSailboat, link: '/submaster/ship-types' },
          { name: 'Ship Via', icon: FaPlane, link: '/submaster/ship-vias' },
          { name: 'Spare Class', icon: FaCog, link: '/submaster/spare-classes' },
          { name: 'Spare Model', icon: FaWrench, link: '/submaster/spare-models' },
          { name: 'Spare Type', icon: FaBox, link: '/submaster/spare-types' },
          { name: 'UN', icon: PiListNumbersFill, link: '/submaster/uns' },
          { name: 'Unit of Measurement', icon: FaRulerCombined, link: '/submaster/unit_of_measures' },
          { name: 'Warehouse', icon: FaWarehouse, link: '/submaster/warehouses' },
        ],
      },
      {
        name: 'Contact Management',
        icon: FaUsers,
        subItems: [
          { name: 'Contact Master', icon: FaUsersCog, link: '/contact-management/customer-master' },
        ],
      },
      {
        name: 'Spare Management',
        icon: BiSitemap,
        subItems: [
          {
            name: 'Spare Master',
            icon: HiMiniWrenchScrewdriver,
            link: '/spare-management/master',
            activeBase: '/spare-management',
          },
        ],
      },
    ],
  },
  {
    sectionName: 'Other Menus',
    items: [
      {
        name: 'Purchase',
        icon: FaShoppingBag,
        subItems: [
          {
            name: 'Material Request',
            icon: FaClipboardCheck,
            link: '/purchase/material-request/master',
            activeBase: '/purchase/material-request',
            state: { type: 'oe' },
          },
        ],
      },
      {
        name: 'Sales',
        icon: FaChartLine,
        subItems: [
          {
            name: 'SEL',
            icon: FaRankingStar,
            link: '/sales-management/sales-log/master',
            activeBase: '/sales-management/sales-log',
          },
          {
            name: 'Material Request',
            icon: FaClipboardCheck,
            link: '/purchase/material-request/master',
            activeBase: '/purchase/material-request',
            state: { type: 'sel' },
          },
        ],
      },
      { name: 'Approval Monitor', icon: FaClipboardList, link: '/update-delete-requests/dashboard', activeBase: '/update-delete-requests' },
    ],
  },
];

// ─── Permission Helpers ───────────────────────────────────────────────────────

const isLinkPermitted = (link: string, permissions: string[], isSuperAdmin: boolean): boolean => {
  if (isSuperAdmin) return true;
  if (/^\/submaster\//.test(link)) return permissions.includes('/submaster/:model');
  return permissions.includes(link);
};

const filterByPermissions = (
  items: LinkItemProps[],
  permissions: string[],
  isSuperAdmin: boolean
): LinkItemProps[] => {
  return items.reduce<LinkItemProps[]>((acc, item) => {
    if (item.subItems) {
      const filteredSubItems = filterByPermissions(item.subItems, permissions, isSuperAdmin);
      if (filteredSubItems.length > 0) acc.push({ ...item, subItems: filteredSubItems });
    } else if (item.link) {
      if (isLinkPermitted(item.link, permissions, isSuperAdmin)) acc.push(item);
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
};

const getFilteredSections = (permissions: string[], isSuperAdmin: boolean): SectionProps[] => {
  return NavigationSections.reduce<SectionProps[]>((acc, section) => {
    const filteredItems = filterByPermissions(section.items, permissions, isSuperAdmin);
    if (filteredItems.length > 0) acc.push({ ...section, items: filteredItems });
    return acc;
  }, []);
};

// ─── Active Link Helper ───────────────────────────────────────────────────────

/**
 * Determines if a nav item is active.
 *
 * When a nav item has a `state` (e.g. { type: 'oe' } vs { type: 'sel' }),
 * two items can share the same pathname but belong to different contexts.
 * In that case we match against location.state so only the correct one
 * highlights — and we do NOT fall back to activeBase/pathname matching,
 * because that would cause both to highlight simultaneously.
 *
 * When no `state` is defined on the item, we use the normal
 * activeBase → exact → prefix rules.
 */
const isLinkActive = (
  link: string,
  pathname: string,
  locationState: any,
  activeBase?: string,
  itemState?: any
): boolean => {
  const normalize = (p: string) => p.replace(/\/+$/, '').toLowerCase();
  const current = normalize(pathname);
  const target = normalize(link);

  // ── State-aware match ──────────────────────────────────────────────────────
  // If the nav item declares a state, only activate when BOTH the path and
  // every state key match. This prevents two items with the same link but
  // different state from both being highlighted.
  if (itemState && Object.keys(itemState).length > 0) {
    const pathMatches = activeBase
      ? current === normalize(activeBase) || current.startsWith(normalize(activeBase) + '/')
      : current === target || current.startsWith(target + '/');

    if (!pathMatches) return false;

    // All state keys declared on the nav item must match location.state
    return Object.entries(itemState).every(
      ([k, v]) => locationState?.[k] === v
    );
  }

  // ── Normal match (no state declared) ──────────────────────────────────────
  if (activeBase) {
    const base = normalize(activeBase);
    return current === base || current.startsWith(base + '/');
  }

  return current === target || current.startsWith(target + '/');
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SidebarContent = ({ onClose, permissions, isSuperAdmin, ...rest }: SidebarProps) => {
  const filteredSections = getFilteredSections(permissions, isSuperAdmin);

  return (
    <Box
      transition="3s ease"
      bg={'#0C2556'}
      borderRight="1px"
      borderRightColor={'gray.200'}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      maxHeight="100vh"
      overflowY={'auto'}
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { width: '6px' },
        '&::-webkit-scrollbar-thumb': { background: 'gray', borderRadius: '24px' },
      }}
      {...rest}
    >
      <Flex h="28" alignItems="center" mx="8" justifyContent="space-between">
        <Image src="/logo.png" alt="logo" height={'20'} width={'auto'} />
        <CloseButton display={{ base: 'flex', md: 'none' }} color={'white'} onClick={onClose} />
      </Flex>
      {filteredSections.map((section) => (
        <Box key={section.sectionName}>
          {section.sectionName !== 'Dashboard' && (
            <Text fontSize="xs" fontWeight="bold" color="gray.400" px="6" py="2">
              {section.sectionName}
            </Text>
          )}
          <VStack align="stretch">
            {section.items.map((link) => (
              <NavItem key={link.name} {...link} />
            ))}
          </VStack>
        </Box>
      ))}
    </Box>
  );
};

// ─── NavItem ──────────────────────────────────────────────────────────────────

const NavItem = ({ icon, name, link, activeBase, state, subItems, ...rest }: LinkItemProps & FlexProps) => {
  const { pathname, state: locationState } = useLocation();

  const hasSubItems = !!subItems?.length;

  // A child is active only if its path AND state both match
  const hasActiveChild =
    subItems?.some((item) =>
      item.link
        ? isLinkActive(item.link, pathname, locationState, item.activeBase, item.state)
        : false
    ) ?? false;

  const isActive =
    (link ? isLinkActive(link, pathname, locationState, activeBase, state) : false) ||
    hasActiveChild;

  const [isOpen, setIsOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [pathname, locationState]);

  if (hasSubItems || !link) {
    return (
      <Box {...rest}>
        <Flex
          align="center"
          p="2"
          mx="4"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          color={isActive ? 'white' : 'gray.400'}
          bg={isActive ? 'whiteAlpha.200' : 'transparent'}
          _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
          onClick={() => setIsOpen((o) => !o)}
        >
          {icon && <Icon mr="4" fontSize="16" _groupHover={{ color: 'white' }} as={icon} />}
          <Text fontSize="xs">{name}</Text>
          {hasSubItems && (
            <Icon
              as={FiChevronDown}
              ml="auto"
              transform={isOpen ? 'rotate(180deg)' : 'rotate(0)'}
            />
          )}
        </Flex>
        {hasSubItems && (
          <Collapse in={isOpen} animateOpacity>
            <VStack align="stretch" pl="6" mt="2" spacing="0" width="full">
              {subItems!.map((subItem) => (
                <NavItem key={subItem.name} {...subItem} />
              ))}
            </VStack>
          </Collapse>
        )}
      </Box>
    );
  }

  return (
    <ChakraLink as={RouterLink} to={link} state={state} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="2"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        color={isActive ? 'white' : 'gray.400'}
        bg={isActive ? 'whiteAlpha.200' : 'transparent'}
        _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
      >
        {icon && <Icon mr="4" fontSize="16" _groupHover={{ color: 'white' }} as={icon} />}
        <Text fontSize="xs">{name}</Text>
      </Flex>
    </ChakraLink>
  );
};

// ─── MobileNav ────────────────────────────────────────────────────────────────

const MobileNav = ({ userInfo, onOpen, ...rest }: MobileProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { logout } = useAuthContext();

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="16"
      alignItems="center"
      bg={'white'}
      borderBottomWidth="1px"
      borderBottomColor={'gray.200'}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />
      <Image display={{ base: 'flex', md: 'none' }} src="/logo.png" alt="logo" height={'20'} width={'auto'} />

      <HStack spacing={{ base: '0', md: '6' }}>
        <IconButton isRound={true} variant="solid" aria-label="open menu" icon={<FiBell />} />
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton py={2} transition="all 0.3s" _focus={{ boxShadow: 'none' }}>
              <HStack>
                <Avatar
                  size={'sm'}
                  src={
                    'https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'
                  }
                />
                <VStack
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                  width="5vw"
                >
                  <Text
                    fontWeight={'bold'}
                    fontSize="sm"
                    color={'gray.800'}
                    sx={{
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      width: '5vw',
                    }}
                  >
                    {Object.keys(userInfo).length > 0
                      ? userInfo?.first_name + ' ' + userInfo?.last_name
                      : 'Loading...'}
                  </Text>
                  <Text
                    fontSize="xs"
                    color={'gray.800'}
                    opacity={0.6}
                    sx={{
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      width: '5vw',
                    }}
                  >
                    {Object.keys(userInfo).length > 0
                      ? userInfo?.is_super_admin === true
                        ? 'Super Admin'
                        : userInfo?.department_role?.department?.name +
                        ' - ' +
                        userInfo?.department_role?.role?.name
                      : 'Loading...'}
                  </Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <Icon as={FiChevronDown} color="gray.400" />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList bg={'white'} borderColor={'gray.200'}>
              <MenuItem
                bg={'white'}
                color={'gray.800'}
                _hover={{ bg: 'gray.100' }}
                onClick={() => setIsProfileModalOpen(true)}
              >
                Edit Profile
              </MenuItem>
              <MenuItem
                bg={'white'}
                color={'gray.800'}
                _hover={{ bg: 'gray.100' }}
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Password Update
              </MenuItem>
              <MenuDivider />
              <MenuItem
                bg={'white'}
                color={'gray.800'}
                _hover={{ bg: 'gray.100' }}
                onClick={() => logout()}
              >
                Sign out
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>

      <PasswordUpdateModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      <ProfileUpdateModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userInfo={userInfo}
      />
    </Flex>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────

const Layout: FC<React.PropsWithChildren> = ({ children }) => {
  const { userInfo, setUserInfo, setIsProfileLoading } = useUserContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { updateToken } = useAuthContext();
  const queryCache = useQueryClient();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const interceptor = Axios.interceptors.response.use(
      (r) => r,
      (error) => {
        if (error?.response?.status === 401 && pathnameRef.current !== '/login') {
          queryCache.cancelQueries();
          updateToken(null);
        }
        throw error;
      }
    );
    return () => Axios.interceptors.response.eject(interceptor);
  }, [updateToken, queryCache]);

  const { data: profileData, isLoading: isProfileLoading } = useProfileInfo();

  useEffect(() => {
    setIsProfileLoading(isProfileLoading);
  }, [isProfileLoading]);

  useEffect(() => {
    if (profileData) {
      setUserInfo(profileData?.data);
    }
  }, [profileData]);

  const permissions: string[] = userInfo?.permissions || [];
  const isSuperAdmin: boolean = userInfo?.is_super_admin === true;

  return (
    <Box minH="100vh" bg={'gray.100'}>
      <SidebarContent
        onClose={onClose}
        permissions={permissions}
        isSuperAdmin={isSuperAdmin}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} permissions={permissions} isSuperAdmin={isSuperAdmin} />
        </DrawerContent>
      </Drawer>
      <MobileNav userInfo={userInfo ?? {}} onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
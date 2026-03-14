import { FC, useEffect, useRef, useState } from 'react';

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
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaCog,
  FaGlobeAmericas,
  FaHome,
  FaUserFriends,
  FaUsers,
  FaUsersCog,
  FaClipboardList 
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
  FaReceipt
} from 'react-icons/fa6';
import { FiBell, FiChevronDown, FiMenu } from 'react-icons/fi';
// import { LuMail } from 'react-icons/lu';
import { useQueryClient } from 'react-query';
import { Link as RouterLink, useLocation } from 'react-router-dom';

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
  subItems?: LinkItemProps[];
}

interface MobileProps extends FlexProps {
  onOpen: () => void;
  userInfo?: any;
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const NavigationSections: Array<SectionProps> = [
  {
    sectionName: 'Dashboard',
    items: [{ name: 'Dashboard', icon: FaHome, link: '/' }, {
      name: 'User Access', icon: FaUsersGear, subItems: [
        {
          icon: FaBuildingUser,
          link: '/user-access/roles',
          name: 'User Roles'
        },
        {
          icon: FaTableList,
          link: '/user-access/departments',
          name: 'Departments'
        },
        {
          icon: FaUserPlus,
          link: '/user-access/admin-users',
          name: 'Admin Users'
        },
        // {
        //   icon: LuMail,
        //   link: '/user-access/email-alert-tepmlates',
        //   name: 'Email Alert'
        // }
      ]
    }],
  },
  {
    sectionName: "Master's Menu",
    items: [
      {
        name: 'Submaster',
        icon: FaUserShield,
        subItems: [
          {
            name: 'Business Type',
            icon: FaBriefcase,
            link: '/submaster/business-types',
          },
          {
            name: 'Contact Type',
            icon: FaUserFriends,
            link: '/submaster/contact-types',
          },
          {
            name: 'Currency',
            icon: FaDollarSign,
            link: '/submaster/currencies',
          },
          {
            name: 'Payment Mode',
            icon: FaCreditCard,
            link: '/submaster/payment-modes',
          },
          {
            name: 'Payment Terms',
            icon: FaCalendarAlt,
            link: '/submaster/payment-terms',
          },
          {
            name: 'Spare Class',
            icon: FaCog,
            link: '/submaster/spare-classes',
          },
          {
            name: 'Spare Type',
            icon: FaBox,
            link: '/submaster/spare-types',
          },
          {
            name: 'Spare Model',
            icon: FaWrench,
            link: '/submaster/spare-models',
          },
          {
            name: 'Priorities',
            icon: FaFlag,
            link: '/submaster/priorities',
          },
          {
            name: 'Conditions',
            icon: FaCheckCircle,
            link: '/submaster/conditions',
          },
          {
            name: 'FOB',
            icon: FaWarehouse,
            link: '/submaster/fobs',
          },
          {
            name: 'Ship Accounts',
            icon: FaShip,
            link: '/submaster/ship-accounts',
          },
          {
            name: 'Ship Modes',
            icon: FaTruck,
            link: '/submaster/ship-modes',
          },
          {
            name: 'Ship Via',
            icon: FaPlane,
            link: '/submaster/ship-vias',
          },
          {
            name: 'Custom Entry',
            icon: FaGlobeAmericas,
            link: '/submaster/custom-entries',
          },
          {
            name: 'Package Type',
            icon: FaBox,
            link: '/submaster/package-types',
          },
          {
            name: 'Ship Type',
            icon: FaSailboat,
            link: '/submaster/ship-types',
          },
          {
            name: 'Warehouse',
            icon: FaWarehouse,
            link: '/submaster/warehouses',
          },
          {
            name: 'Rack',
            icon: FaLayerGroup,
            link: '/submaster/racks',
          },
          {
            name: 'Bin Location',
            icon: FaBoxOpen,
            link: '/submaster/bin-locations',
          },
          {
            name: 'Mode of Receipt',
            icon: FaReceipt,
            link: '/submaster/mode-of-receipts',
          }
        ],
      },
      {
        name: 'Contact Management',
        icon: FaUsers,
        subItems: [
          {
            name: 'Contact Master',
            icon: FaUsersCog,
            link: '/contact-management/customer-master',
          }
        ],
      },
    ],
  },
  {
    sectionName: 'Other Menus',
    items: [
      { name: 'Approval Monitor', icon: FaClipboardList, link: '/update-delete-requests/dashboard' },
    ]}
  //     // { name: 'Sales', icon: SlTag },
  //     {
  //       name: 'Purchase',
  //       icon: FaShoppingBag,
  //       subItems: [
  //         {
  //           name: 'Material Request',
  //           icon: FaClipboardCheck,
  //           link: '/purchase/purchase-request',
  //         },
  //         {
  //           name: 'PRFQ',
  //           icon: FaFileAlt,
  //           link: '/purchase/prfq',
  //         },
  //         {
  //           name: 'Supplier Pricing Update',
  //           icon: FaFileSignature,
  //           link: '/purchase/quotation',
  //         },
  //         {
  //           name: 'Purchase Order',
  //           icon: FaFileInvoice,
  //           link: '/purchase/purchase-order',
  //         },
  //         {
  //           name: 'STF',
  //           icon: FaMapMarker,
  //           link: '/purchase/stf',
  //         },
  //         {
  //           name: 'GRN',
  //           icon: FaClipboardCheck,
  //           link: '/purchase/grn',
  //         },
  //         {
  //           name: 'Inspection',
  //           icon: FaI,
  //           link: '/inspection/create',
  //         },
  //         {
  //           name: 'QC Approval',
  //           icon: FaPlaneCircleCheck,
  //           link: '/qc-approval',
  //         },
  //       ],
  //     },
  //     {
  //       name: 'Logistics',
  //       icon: FaTruck,
  //       subItems: [
  //         {
  //           name: 'Request',
  //           icon: FaClipboardCheck,
  //           link: '/logistics/request',
  //         },
  //         {
  //           name: 'Receive',
  //           icon: FaCheckCircle,
  //           link: '/logistics/receive',
  //         },
  //         // {
  //         //   name: 'Shipment',
  //         //   icon: FaShip,
  //         //   link: '/logistics/shipment',
  //         // },
  //         // {
  //         //   name: 'Track',
  //         //   icon: FaMapMarker,
  //         //   link: '/logistics/track',
  //         // },
  //       ],
  //     },
  //     // { name: 'Inventory', icon: HiOutlineCube },
  //     // { name: 'Shipment Track', icon: LiaSearchLocationSolid },
  //     // { name: 'Store', icon: BiStoreAlt },
  //     // { name: 'Account', icon: HiOutlineUserCircle },
  //     // { name: 'Reports', icon: HiOutlineDocumentReport },
  //     // { name: 'QC', icon: MdOutlineContactSupport },
  //   ],
  // },
];

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
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
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'gray',
          borderRadius: '24px',
        },
      }}
      {...rest}
    >
      <Flex h="28" alignItems="center" mx="8" justifyContent="space-between">
        <Image src="/logo.png" alt="logo" height={'20'} width={'auto'} />
        <CloseButton
          display={{ base: 'flex', md: 'none' }}
          color={'white'}
          onClick={onClose}
        />
      </Flex>
      {NavigationSections.map((section) => (
        <Box key={section.sectionName}>
          {section.sectionName !== 'Dashboard' && (
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              px="6"
              py="2"
            >
              {section.sectionName}
            </Text>
          )}
          <VStack align="stretch">
            {section.items.map((link) => (
              <NavItem
                key={link.name}
                icon={link.icon}
                name={link.name}
                link={link.link}
                subItems={link.subItems}
              />
            ))}
          </VStack>
        </Box>
      ))}
    </Box>
  );
};

const NavItem = ({
  icon,
  name,
  link,
  subItems,
  ...rest
}: LinkItemProps & FlexProps) => {
  const { pathname } = useLocation();
  const hasActiveChild =
    subItems?.some((item) => item.link && pathname.startsWith(item.link)) || false;

  const isActive =
    (link === '/'
      ? pathname === '/'
      : link && pathname.startsWith(link)) || hasActiveChild;

  const [isOpen, setIsOpen] = useState(hasActiveChild);

  const hasSubItems =
    subItems && Array.isArray(subItems) && subItems.length > 0;

  const handleClick = (event: React.MouseEvent) => {
    if (hasSubItems) {
      event.preventDefault(); // Prevent link navigation
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [pathname]);

  if (hasSubItems || !link) {
    // Render as div if it has subItems or no link
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
          _hover={{
            bg: 'whiteAlpha.200',
            color: 'white',
          }}
          onClick={handleClick}
        >
          {icon && (
            <Icon
              mr="4"
              fontSize="16"
              _groupHover={{ color: 'white' }}
              as={icon}
            />
          )}
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
              {subItems.map((subItem) => (
                <NavItem key={subItem.name} {...subItem} />
              ))}
            </VStack>
          </Collapse>
        )}
      </Box>
    );
  } else {
    // Render as RouterLink if it's a navigable link without subItems
    return (
      <ChakraLink
        as={RouterLink}
        to={link}
      // {...rest}
      // style={{ textDecoration: 'none' }}
      >
        <Flex
          align="center"
          p="2"
          mx="4"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          color={isActive ? 'white' : 'gray.400'}
          bg={isActive ? 'whiteAlpha.200' : 'transparent'}
          _hover={{
            bg: 'whiteAlpha.200',
            color: 'white',
          }}
        >
          {icon && (
            <Icon
              mr="4"
              fontSize="16"
              _groupHover={{ color: 'white' }}
              as={icon}
            />
          )}
          <Text fontSize="xs">{name}</Text>
        </Flex>
      </ChakraLink>
    );
  }
};

const MobileNav = ({ userInfo, onOpen, ...rest }: MobileProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { logout } = useAuthContext();

  const handleCloseModal = () => {
    setIsProfileModalOpen(false);
    setIsPasswordModalOpen(false);
  };

  useEffect(() => { }, []);
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

      <Image
        display={{ base: 'flex', md: 'none' }}
        src="/logo.png"
        alt="logo"
        height={'20'}
        width={'auto'}
      />

      <HStack spacing={{ base: '0', md: '6' }}>
        <IconButton
          isRound={true}
          variant="solid"
          aria-label="open menu"
          icon={<FiBell />}
        />
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: 'none' }}
            >
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
                      ? userInfo?.role?.name
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
        onClose={handleCloseModal}
      />
      <ProfileUpdateModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseModal}
        userInfo={userInfo}
      />
    </Flex>
  );
};

const Layout: FC<React.PropsWithChildren> = ({ children }) => {
  const { setUserInfo } = useUserContext();
  const [userInfo, setLoggedUserInfo] = useState<any>({});
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
        if (
          error?.response?.status === 401 &&
          pathnameRef.current !== '/login'
        ) {
          queryCache.cancelQueries();
          updateToken(null);
          // if (pathname !== pathnameRef.current) {
          //   updateToken(null);
          // }
        }
        throw error;
      }
    );

    return () => Axios.interceptors.response.eject(interceptor);
  }, [updateToken, queryCache]);

  const { data: profileData } = useProfileInfo();
  // const userInfo = data?.data?.menu || [];

  useEffect(() => {
    if (profileData) {
      setLoggedUserInfo(profileData?.data);
      setUserInfo(profileData?.data);
    }
  }, [profileData]);

  return (
    <Box minH="100vh" bg={'gray.100'}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
      // size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav userInfo={userInfo} onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

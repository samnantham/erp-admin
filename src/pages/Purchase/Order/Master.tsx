import {
    HStack, Heading, Stack, Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Button
} from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { SlideIn } from '@/components/SlideIn';
import { useRouterContext } from '@/services/auth/RouteContext';
import { PurchaseOrderSearch } from '@/components/SearchBars/Purchase/Order';
import { BiChevronDown } from "react-icons/bi";

export const PurchaseOrderMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();
    const canCreate = otherPermissions.create === 1;

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>
                <HStack justify="space-between">
                    <Heading as="h4" size="md">Purchase Orders</Heading>
                    {canCreate && (
                        <Menu placement="bottom-start">
                            <MenuButton
                                as={Button}
                                size="sm"
                                px={4}
                                py={2}
                                borderRadius="md"
                                bg="brand.600"
                                color="white"
                                fontWeight="semibold"
                                leftIcon={<LuPlus />}
                                rightIcon={<BiChevronDown />}
                                _hover={{
                                    bg: "brand.500",
                                    transform: "translateY(-1px)"
                                }}
                                _active={{
                                    bg: "brand.700",
                                    transform: "scale(0.98)",
                                }}
                                transition="all 0.2s ease"
                            >
                                Add New
                            </MenuButton>

                            <MenuList
                                p={2}
                                borderRadius="sm"
                                border="1px solid"
                                borderColor="gray.100"
                                minW="170px"
                            >
                                <MenuItem
                                    borderRadius="md"
                                    fontWeight="medium"
                                    _hover={{
                                        bg: "brand.50",
                                        color: "brand.600",
                                    }}
                                    onClick={() => navigate('/purchase/order/form')}
                                >
                                    Direct PO
                                </MenuItem>

                                <MenuItem
                                    borderRadius="md"
                                    px={3}
                                    py={2}
                                    fontWeight="medium"
                                    _hover={{
                                        bg: "brand.50",
                                        color: "brand.600",
                                    }}
                                    onClick={() => navigate('/purchase/order/quote-form')}
                                >
                                    Quotation PO
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    )}
                </HStack>
                <PurchaseOrderSearch
                    mode="page"
                    canUpdate={otherPermissions.update === 1}
                    canDelete={otherPermissions.update === 1}
                    canView={otherPermissions.view === 1}
                />
            </Stack>
        </SlideIn>
    );
};

export default PurchaseOrderMaster;
import { HStack, Heading, Stack } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useRouterContext } from '@/services/auth/RouteContext';
import { SupplierPricingUpdateSearch } from '@/components/SearchBars/Purchase/SupplierPricingUpdate';

export const SupplierPricingUpdateMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();
    const canCreate = otherPermissions.create === 1;

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>
                <HStack justify="space-between">
                    <Heading as="h4" size="md">Supplier Pricing Update</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary"
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/purchase/supplier-pricing-update/form')}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>
                <SupplierPricingUpdateSearch
                    mode="page"
                    canUpdate={otherPermissions.update === 1}
                    canDelete={otherPermissions.update === 1}
                    canView={otherPermissions.view === 1}
                />
            </Stack>
        </SlideIn>
    );
};

export default SupplierPricingUpdateMaster;
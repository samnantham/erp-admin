import { HStack, Heading, Stack } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useRouterContext } from '@/services/auth/RouteContext';
import { MaterialRequestSearch } from '@/components/SearchBars/Purchase/MaterialRequest';

export const MaterialRequestMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();

    const canCreate = otherPermissions.create === 1;
    const location = useLocation();
    const state = location.state as { type?: string } | null;

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                <HStack justify="space-between">
                    <Heading as="h4" size="md">Material Request</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary"
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => 
                                navigate('/purchase/material-request/form', {
                                    state: { type: state?.type ?? 'oe' },
                                })
                            }
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                <MaterialRequestSearch
                    mode="page"
                    canUpdate={otherPermissions.update === 1}
                    canView={otherPermissions.view === 1}
                />

            </Stack>
        </SlideIn>
    )
};

export default MaterialRequestMaster;

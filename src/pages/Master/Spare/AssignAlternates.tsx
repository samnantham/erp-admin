import { useEffect, useMemo, useState } from 'react';

import { ChevronRightIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Checkbox,
  Collapse,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { FiChevronDown, FiChevronUp, FiPackage, FiSave, FiSearch } from 'react-icons/fi';
import { FaLayerGroup } from 'react-icons/fa';
import { FaListCheck } from 'react-icons/fa6';
import { RiListCheck2 } from 'react-icons/ri';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { LuPlus } from 'react-icons/lu';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { PairDocUpload } from '@/components/PairDocUpload';
import LoadingOverlay from '@/components/LoadingOverlay';
import ConfirmationPopup from '@/components/ConfirmationPopup';
import { PartNumberModal } from '@/components/Modals/SpareMaster';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useToastError, useToastSuccess } from '@/components/Toast';

import {
  fetchSpareDetails,
  useAssignAltParts,
  useSearchPartNumber,
  usePartNumberDetails,
} from '@/services/master/spare/service';

// ── Types ──────────────────────────────────────────────────────────────────
interface PartNumberItem {
  part_number_id: string;
  alternate_part_number_id: string;
  remark: string;
  alt_ref_doc?: string;
  is_deleted?: boolean;
}

interface GroupNode {
  id: string;
  name: string;
  description: string;
  isMain: boolean;
}

interface Pair {
  key: string;
  from_id: string;
  from_part: string;
  to_id: string;
  to_part: string;
  remark: string;
  alt_ref_doc?: string;
  exists: boolean;
  enabled: boolean;
}

interface StagedPart {
  id: string;
  name: string;
  description: string;
}

interface SuggestedPart {
  id: string;
  name: string;
  description: string;
  viaPart: string;
  viaPartId: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const pairKey = (fromId: string, toId: string) => `${fromId}:${toId}`;

const generatePairsForNewNode = (
  newNode: GroupNode,
  existingNodes: GroupNode[],
  existingPairKeys: Set<string>
): Pair[] => {
  const pairs: Pair[] = [];
  existingNodes.forEach((node) => {
    const k1 = pairKey(newNode.id, node.id);
    pairs.push({
      key: k1,
      from_id: newNode.id, from_part: newNode.name,
      to_id: node.id, to_part: node.name,
      remark: '', exists: existingPairKeys.has(k1), enabled: existingPairKeys.has(k1),
    });
    const k2 = pairKey(node.id, newNode.id);
    pairs.push({
      key: k2,
      from_id: node.id, from_part: node.name,
      to_id: newNode.id, to_part: newNode.name,
      remark: '', exists: existingPairKeys.has(k2), enabled: existingPairKeys.has(k2),
    });
  });
  return pairs;
};

// ── Component ──────────────────────────────────────────────────────────────
export const AssignAlternateParts = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: details, isLoading, refetch: refreshPartdetails } = usePartNumberDetails(id);
  const getSpareDetails = fetchSpareDetails();

  const {
    isOpen: isNewSpareModalOpen,
    onOpen: onNewSpareModalOpen,
    onClose: onNewSpareModalClose,
  } = useDisclosure();
  const [newSpareName, setSpareName] = useState('');

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [queryParams, setQueryParams] = useState<any>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentlyCreated, setRecentlyCreated] = useState<string[]>([]);

  const { data: listData, isLoading: loadingSearch, refetch: refreshSpares } = useSearchPartNumber(queryParams);
  const searchResults: any[] = listData?.data ?? [];

  // ── Core state ────────────────────────────────────────────────────────────
  const [nodes, setNodes] = useState<GroupNode[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [existingPairKeys, setExistingPairKeys] = useState<Set<string>>(new Set());
  const [pageLoading, setPageLoading] = useState(true);

  const [confirmRemoveNode, setConfirmRemoveNode] = useState(false);
  const [removeNodeTargetId, setRemoveNodeTargetId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);

  // ── Track original server values to detect real changes ──────────────────
  const [originalPairs, setOriginalPairs] = useState<Record<string, { remark: string; alt_ref_doc?: string }>>({});

  // ── Helper: build snapshot from a pairs array ─────────────────────────────
  const buildSnapshot = (allPairs: Pair[]) => {
    const snapshot: Record<string, { remark: string; alt_ref_doc?: string }> = {};
    allPairs.forEach((p) => {
      if (p.exists) snapshot[p.key] = { remark: p.remark, alt_ref_doc: p.alt_ref_doc };
    });
    return snapshot;
  };

  // ── Suggestion state ──────────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<SuggestedPart[]>([]);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [loadingNodeIds, setLoadingNodeIds] = useState<Set<string>>(new Set());
  const [addingNodeId, setAddingNodeId] = useState<string | null>(null);

  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [exceptIds, setExceptIds] = useState<string[]>([]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const mainNode = nodes.find((n) => n.isMain) ?? null;
  const newPairs = pairs.filter((p) => !p.exists && p.enabled);

  const pairsToDelete = pairs.filter(
    (p) => p.exists && !p.enabled && p.from_id === id
  );

  const updatedExistingPairs = pairs.filter((p) => {
    if (!p.exists || p.from_id !== id || !p.enabled) return false;
    const orig = originalPairs[p.key];
    if (!orig) return false;
    return p.remark !== orig.remark || (p.alt_ref_doc ?? '') !== (orig.alt_ref_doc ?? '');
  });

  const canSave = newPairs.length > 0 || pairsToDelete.length > 0 || updatedExistingPairs.length > 0;

  const existingCount = pairs.filter((p) => p.exists && p.enabled).length;
  const checkedNewCount = pairs.filter((p) => !p.exists && p.enabled).length;
  const uncheckedCount = pairs.filter((p) => !p.exists && !p.enabled).length;
  const allNewChecked = pairs.filter((p) => !p.exists).every((p) => p.enabled);
  const allNewUnchecked = pairs.filter((p) => !p.exists).every((p) => !p.enabled);

  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => s.id !== id),
    [suggestions, id]
  );

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    const allExcluded = [...new Set([...(id ? [id] : []), ...exceptIds])];
    setQueryParams({
      query: debouncedSearch,
      except_ids: allExcluded.join(','),
    });
  }, [debouncedSearch, exceptIds, id]);

  useEffect(() => {
    if (recentlyCreated.length > 0)
      setQueryParams({ exist_ids: recentlyCreated.join(',') });
  }, [recentlyCreated]);

  useEffect(() => {
    if (searchText === '') setExceptIds([...(id ? [id] : []), ...groupMemberIds.filter((i) => i !== id)]);
  }, [searchText, groupMemberIds, id]);

  // ── Fetch suggestions ─────────────────────────────────────────────────────
  const fetchSuggestionsForNodes = async (targetNodes: GroupNode[]) => {
    const targetIds = targetNodes.map((n) => n.id);
    setLoadingNodeIds((prev) => new Set([...prev, ...targetIds]));
    try {
      const newSuggestions: SuggestedPart[] = [];
      await Promise.all(
        targetNodes.map(async (node) => {
          const spareInfo = await getSpareDetails(node.id);
          (spareInfo?.data?.alternates ?? []).forEach((sd: any) => {
            const altId = sd.alternate_part_number_id ?? sd.alternate_part_number?.id;
            if (!altId || altId === id) return;
            if (altId === node.id) return;
            if (newSuggestions.some((s) => s.id === altId && s.viaPartId === node.id)) return;
            newSuggestions.push({
              id: altId,
              name: sd.alternate_part_number?.name ?? '',
              description: sd.alternate_part_number?.description ?? '',
              viaPart: node.name,
              viaPartId: node.id,
            });
          });
        })
      );
      setSuggestions((prev) => [
        ...prev,
        ...newSuggestions.filter(
          (s) => !prev.some((p) => p.id === s.id && p.viaPartId === s.viaPartId)
        ),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNodeIds((prev) => {
        const next = new Set(prev);
        targetIds.forEach((i) => next.delete(i));
        return next;
      });
    }
  };

  // ── Load existing data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!details) return;
    const load = async () => {
      try {
        const mainNode: GroupNode = {
          id: details?.data.id,
          name: details?.data.name,
          description: details?.data.description,
          isMain: true,
        };

        const usedIds: string[] = [details?.data?.id];
        const pairKeys = new Set<string>();
        const allNodes: GroupNode[] = [mainNode];
        const allPairs: Pair[] = [];
        const memberSpareInfoMap = new Map<string, any>();

        const existingMembers: GroupNode[] = await Promise.all(
          (details?.data?.alternates ?? []).map(async (item: any) => {
            const altId: string = item.alternate_part_number.id;
            usedIds.push(altId);
            pairKeys.add(pairKey(details?.data?.id, altId));
            const spareInfo = await getSpareDetails(altId);
            memberSpareInfoMap.set(altId, spareInfo);
            return {
              id: altId,
              name: item.alternate_part_number.name,
              description: item.alternate_part_number.description,
              isMain: false,
            };
          })
        );

        memberSpareInfoMap.forEach((spareInfo, memberId) => {
          (spareInfo?.data?.alternates ?? []).forEach((sd: any) => {
            const crossId: string = sd.alternate_part_number_id ?? sd.alternate_part_number?.id;
            if (!crossId) return;
            pairKeys.add(pairKey(memberId, crossId));
            pairKeys.add(pairKey(crossId, memberId));
          });
        });

        allNodes.push(...existingMembers);

        for (let i = 0; i < allNodes.length; i++) {
          for (let j = 0; j < allNodes.length; j++) {
            if (i === j) continue;
            const from = allNodes[i];
            const to = allNodes[j];
            const k = pairKey(from.id, to.id);
            allPairs.push({
              key: k,
              from_id: from.id, from_part: from.name,
              to_id: to.id, to_part: to.name,
              remark: '',
              exists: pairKeys.has(k),
              enabled: pairKeys.has(k),
            });
          }
        }

        // ── FIX 1: load remark AND alt_ref_doc from API response ─────────────
        details?.data?.alternates?.forEach((item: any) => {
          const k = pairKey(details?.data?.id, item.alternate_part_number.id);
          const pair = allPairs.find((p) => p.key === k);
          if (pair) {
            pair.remark = item.remark || '';
            pair.alt_ref_doc = item.alt_ref_doc || undefined;
          }
        });

        memberSpareInfoMap.forEach((spareInfo, memberId) => {
          (spareInfo?.data?.alternates ?? []).forEach((sd: any) => {
            const crossId: string = sd.alternate_part_number_id ?? sd.alternate_part_number?.id;
            if (!crossId) return;
            const k = pairKey(memberId, crossId);
            const pair = allPairs.find((p) => p.key === k);
            if (pair) {
              pair.remark = sd.remark || '';
              pair.alt_ref_doc = sd.alt_ref_doc || undefined;
            }
          });
        });

        if (existingMembers.length > 0) {
          setLoadingNodeIds(new Set(existingMembers.map((n) => n.id)));
        }

        setExistingPairKeys(pairKeys);
        setNodes(allNodes);
        setPairs(allPairs);
        setGroupMemberIds(usedIds);
        setExceptIds(usedIds);
        setOriginalPairs(buildSnapshot(allPairs));

        if (existingMembers.length > 0)
          await fetchSuggestionsForNodes(existingMembers);
      } catch (e) {
        console.error(e);
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [details]);

  // ── Add node ──────────────────────────────────────────────────────────────
  const addNodeToGroup = async (spare: StagedPart) => {
    if (groupMemberIds.includes(spare.id)) return;

    setAddingNodeId(spare.id);

    const newNode: GroupNode = {
      id: spare.id,
      name: spare.name,
      description: spare.description,
      isMain: false,
    };

    const updatedPairKeys = new Set(existingPairKeys);
    let spareInfo: any = null;
    try {
      spareInfo = await getSpareDetails(spare.id);
      (spareInfo?.data?.alternates ?? []).forEach((sd: any) => {
        const crossId: string = sd.alternate_part_number_id ?? sd.alternate_part_number?.id;
        if (!crossId) return;
        updatedPairKeys.add(pairKey(spare.id, crossId));
        updatedPairKeys.add(pairKey(crossId, spare.id));
      });
    } catch (e) {
      console.error(e);
    }

    setExistingPairKeys(updatedPairKeys);

    const newPairsForNode = generatePairsForNewNode(newNode, nodes, updatedPairKeys);

    newPairsForNode.forEach((p) => {
      if (!p.exists && p.from_id === id) {
        p.enabled = true;
      }
    });

    if (spareInfo) {
      (spareInfo?.data?.alternates ?? []).forEach((sd: any) => {
        const crossId: string = sd.alternate_part_number_id ?? sd.alternate_part_number?.id;
        if (!crossId) return;
        const k = pairKey(spare.id, crossId);
        const pair = newPairsForNode.find((p) => p.key === k);
        if (pair) {
          pair.remark = sd.remark || '';
          pair.alt_ref_doc = sd.alt_ref_doc || undefined;
        }
      });
    }

    const newGroupIds = [...groupMemberIds, spare.id];
    setNodes((prev) => [...prev, newNode]);
    setPairs((prev) => [...prev, ...newPairsForNode]);
    setGroupMemberIds(newGroupIds);
    setExceptIds((prev) => [...prev, spare.id]);
    setAddingNodeId(null);

    await fetchSuggestionsForNodes([newNode]);
  };

  const handlePickFromSearch = (spare: any) => {
    if (groupMemberIds.includes(spare.id)) return;
    addNodeToGroup(spare);
    setSearchText('');
    setShowDropdown(false);
  };

  // ── Toggle pairs ──────────────────────────────────────────────────────────
  const togglePair = (key: string) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p;
        if (p.exists && p.from_id === id) return { ...p, enabled: !p.enabled };
        if (!p.exists) return { ...p, enabled: !p.enabled };
        return p;
      })
    );
  };

  const toggleAllNewPairs = (checked: boolean) => {
    setPairs((prev) => prev.map((p) => (!p.exists ? { ...p, enabled: checked } : p)));
  };

  // ── Remark ────────────────────────────────────────────────────────────────
  const debouncedPairRemark = useMemo(
    () =>
      debounce((key: string, value: string) => {
        setPairs((prev) =>
          prev.map((p) => (p.key === key ? { ...p, remark: value } : p))
        );
      }, 400),
    []
  );
  useEffect(() => () => debouncedPairRemark.cancel(), [debouncedPairRemark]);

  // ── Remove node ───────────────────────────────────────────────────────────
  const handleConfirmRemoveNode = () => {
    if (!removeNodeTargetId) return;
    setNodes((prev) => prev.filter((n) => n.id !== removeNodeTargetId));
    setPairs((prev) =>
      prev.filter((p) => p.from_id !== removeNodeTargetId && p.to_id !== removeNodeTargetId)
    );
    const newGroupIds = groupMemberIds.filter((i) => i !== removeNodeTargetId);
    setGroupMemberIds(newGroupIds);
    setExceptIds(newGroupIds);
    setRemoveNodeTargetId(null);
    setConfirmRemoveNode(false);
  };

  // ── Spare create modal ────────────────────────────────────────────────────
  const openSpareCreateModal = (input?: string) => {
    setSpareName(input?.toUpperCase() ?? '');
    onNewSpareModalOpen();
  };

  const handleCloseSpareModal = (status: boolean, newId: string) => {
    if (status) {
      setRecentlyCreated((prev) => [...prev, newId]);
      setTimeout(async () => {
        const spareInfo = await getSpareDetails(newId).catch(() => null);
        if (spareInfo) {
          addNodeToGroup({
            id: spareInfo?.data?.id,
            name: spareInfo?.data?.name,
            description: spareInfo?.data?.description,
          });
          refreshSpares();
        }
      }, 800);
    }
    setSpareName('');
    setSearchText('');
    onNewSpareModalClose();
  };

  // ── Assign API ────────────────────────────────────────────────────────────
  const assignAlternateParts = useAssignAltParts();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const handleConfirmSave = () => {
    // Capture current lists before state mutation
    const savedNewPairs = [...newPairs];
    const savedPairsToDelete = [...pairsToDelete];

    const payload: PartNumberItem[] = [
      ...savedNewPairs.map((p) => ({
        part_number_id: p.from_id,
        alternate_part_number_id: p.to_id,
        remark: p.remark,
        alt_ref_doc: p.alt_ref_doc || undefined,
        is_deleted: false,
      })),
      ...savedPairsToDelete.map((p) => ({
        part_number_id: p.from_id,
        alternate_part_number_id: p.to_id,
        remark: p.remark,
        alt_ref_doc: p.alt_ref_doc || undefined,
        is_deleted: true,
      })),
      ...updatedExistingPairs.map((p) => ({
        part_number_id: p.from_id,
        alternate_part_number_id: p.to_id,
        remark: p.remark,
        alt_ref_doc: p.alt_ref_doc || undefined,
        is_deleted: false,
      })),
    ];

    setConfirmSave(false);
    setPageLoading(true);
    assignAlternateParts.mutate(payload, {
      onSuccess: ({ successful_mappings, errors }) => {
        // Update pairs state + refresh snapshot so save button disables
        setPairs((prevPairs) => {
          const afterSave = prevPairs
            .map((p) => {
              if (savedNewPairs.some((np) => np.key === p.key)) return { ...p, exists: true };
              return p;
            })
            .filter((p) => !savedPairsToDelete.some((dp) => dp.key === p.key));
          setOriginalPairs(buildSnapshot(afterSave));
          return afterSave;
        });

        const successCount = successful_mappings?.length ?? 0;
        const errorCount = errors?.length ?? 0;

        if (successCount > 0 && errorCount === 0) {
          toastSuccess({
            title: 'Mappings saved',
            description: `${successCount} mapping${successCount !== 1 ? 's' : ''} saved successfully.`,
          });
        } else if (successCount > 0 && errorCount > 0) {
          toastSuccess({
            title: 'Partially saved',
            description: `${successCount} saved, ${errorCount} failed.`,
          });
        } else {
          toastError({
            title: 'Save failed',
            description: `${errorCount} mapping${errorCount !== 1 ? 's' : ''} could not be saved.`,
          });
        }

        refreshPartdetails();
        setPageLoading(false);
      },
      onError: () => {
        toastError({ title: 'Save failed', description: 'An unexpected error occurred.' });
        setPageLoading(false);
      },
    });
  };

  // ── Save button label helper ──────────────────────────────────────────────
  const saveLabel = (() => {
    const parts: string[] = [];
    if (checkedNewCount > 0) parts.push(`+${checkedNewCount} Add`);
    if (pairsToDelete.length > 0) parts.push(`-${pairsToDelete.length} Remove`);
    return parts.length > 0 ? `Save (${parts.join(', ')})` : 'Save';
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SlideIn>
      <Stack pl={2} spacing={3}>

        {/* Header */}
        <HStack justify="space-between">
          <Stack spacing={0}>
            <Breadcrumb fontWeight="medium" fontSize="sm"
              separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
              <BreadcrumbItem color="brand.500">
                <BreadcrumbLink as={Link} to="/spares-master">Spares Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage color="gray.500">
                <BreadcrumbLink>Assign Alternate Part Numbers</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <HStack spacing={3} align="center">
              <Heading as="h4" size="md">Assign Alternate Part Numbers</Heading>
              {details?.data?.name && (
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                  {details?.data?.name}
                </Badge>
              )}
            </HStack>
          </Stack>
          <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />} size="sm"
            onClick={() => navigate(-1)}>
            Back
          </ResponsiveIconButton>
        </HStack>

        <LoadingOverlay isLoading={isLoading || pageLoading || addingNodeId !== null}>
          <Box bg="white" borderRadius="lg" boxShadow="md" overflow="hidden">

            {/* Search bar */}
            <Box bg="gray.50" borderBottom="1px solid" borderColor="gray.200" px={5} py={4}>
              <Box position="relative">
                <InputGroup size="sm" maxW="420px">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search part number to add to this group..."
                    value={searchText}
                    onChange={(e) => { setSearchText(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    bg="white" borderRadius="md"
                  />
                </InputGroup>

                {showDropdown && (searchText.length > 0 || loadingSearch) && (
                  <Box position="absolute" top="calc(100% + 4px)" left={0} w="420px"
                    bg="white" border="1px solid" borderColor="gray.200"
                    borderRadius="md" boxShadow="lg" zIndex={10} maxH="240px" overflowY="auto">
                    {loadingSearch ? (
                      <Box px={4} py={3}><Text fontSize="sm" color="gray.400">Searching...</Text></Box>
                    ) : searchResults.length === 0 ? (
                      <VStack py={4} spacing={2}>
                        <Text fontSize="sm" color="gray.400">No parts found</Text>
                        <Button size="xs" colorScheme="brand" variant="outline" leftIcon={<LuPlus />}
                          onMouseDown={() => openSpareCreateModal(searchText)}>
                          Create "{searchText}"
                        </Button>
                      </VStack>
                    ) : (
                      <>
                        {searchResults.map((spare: any) => {
                          const isAdding = addingNodeId === spare.id;
                          return (
                            <HStack key={spare.id} px={4} py={2.5}
                              cursor={isAdding ? 'default' : 'pointer'}
                              opacity={isAdding ? 0.7 : 1}
                              _hover={{ bg: isAdding ? 'white' : 'blue.50' }}
                              borderBottom="1px solid" borderColor="gray.100"
                              onMouseDown={() => !isAdding && handlePickFromSearch(spare)}>
                              <Box flex={1}>
                                <Text fontSize="sm" fontWeight="medium">{spare.name}</Text>
                                {spare.description && (
                                  <Text fontSize="xs" color="gray.500" isTruncated>{spare.description}</Text>
                                )}
                              </Box>
                              {isAdding && <Spinner size="xs" color="green.500" />}
                            </HStack>
                          );
                        })}
                        <Box px={4} py={2.5} cursor="pointer" _hover={{ bg: 'blue.50' }}
                          borderTop="1px solid" borderColor="gray.200"
                          onMouseDown={() => openSpareCreateModal(searchText)}>
                          <Text fontSize="sm" color="brand.500" fontWeight="medium">+ Create new part</Text>
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            <HStack align="stretch" spacing={0} minH="60vh">

              {/* LEFT: Group members */}
              <Box w="280px" minW="240px" borderRight="1px solid" borderColor="gray.200"
                display="flex" flexDirection="column" flexShrink={0}>
                <HStack px={4} py={3} borderBottom="1px solid" borderColor="gray.100" justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={FaLayerGroup} color="gray.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">Mapped Part Numbers</Text>
                  </HStack>
                  <Badge colorScheme="blue" borderRadius="full" fontSize="xs">{nodes.length}</Badge>
                </HStack>

                <Box overflowY="auto" flex={1}>
                  {nodes.map((node) => {
                    const nodeSuggestions = visibleSuggestions.filter((s) => s.viaPartId === node.id);
                    const includedSuggestions = nodeSuggestions.filter((s) => nodeIds.has(s.id));
                    const availableSuggestions = nodeSuggestions.filter((s) => !nodeIds.has(s.id));
                    const isExpanded = expandedNodeId === node.id;
                    const isLoadingNode = loadingNodeIds.has(node.id);
                    const totalCount = nodeSuggestions.length;
                    const hasSuggestions = totalCount > 0 || isLoadingNode;

                    return (
                      <Box key={node.id} borderBottom="1px solid" borderColor="gray.100">
                        <HStack px={4} py={3} justify="space-between"
                          _hover={{ bg: 'gray.50' }} transition="background 0.1s">
                          <Box minW={0} flex={1}>
                            <HStack spacing={1.5} mb={0.5}>
                              {node.isMain && (
                                <Badge colorScheme="blue" fontSize="9px" variant="solid" borderRadius="sm">
                                  MAIN
                                </Badge>
                              )}
                              <Text fontSize="sm" fontWeight="semibold" color="gray.800" isTruncated>
                                {node.name}
                              </Text>
                            </HStack>
                            {node.description && (
                              <Text fontSize="xs" color="gray.500" isTruncated>{node.description}</Text>
                            )}
                          </Box>

                          <HStack spacing={1} flexShrink={0}>
                            {!node.isMain && hasSuggestions && (
                              <Tooltip
                                label={isExpanded ? 'Hide alternates' : `${totalCount} alternate${totalCount !== 1 ? 's' : ''}`}
                                hasArrow isDisabled={isLoadingNode}
                              >
                                <IconButton
                                  aria-label="Toggle suggestions"
                                  icon={
                                    isLoadingNode ? (
                                      <Box w="22px" h="22px" display="flex" alignItems="center" justifyContent="center">
                                        <Box as="span" w="14px" h="14px"
                                          border="2px solid" borderColor="green.300"
                                          borderTopColor="green.600" borderRadius="full"
                                          display="inline-block"
                                          sx={{
                                            animation: 'spin 0.7s linear infinite',
                                            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                                          }}
                                        />
                                      </Box>
                                    ) : (
                                      <HStack spacing={0.5}>
                                        {totalCount > 0 && (
                                          <Badge colorScheme="green" fontSize="12px" borderRadius="full"
                                            variant="solid" display="flex" alignItems="center"
                                            justifyContent="center" minW="22px" h="22px">
                                            {totalCount}
                                          </Badge>
                                        )}
                                        <Icon as={isExpanded ? FiChevronUp : FiChevronDown} boxSize={3} />
                                      </HStack>
                                    )
                                  }
                                  variant="ghost" colorScheme="green" size="xs"
                                  isDisabled={isLoadingNode}
                                  onClick={() => !isLoadingNode && setExpandedNodeId(isExpanded ? null : node.id)}
                                />
                              </Tooltip>
                            )}
                            {!node.isMain && (
                              <Tooltip label="Remove from group" hasArrow>
                                <IconButton
                                  aria-label="Remove node"
                                  icon={<DeleteIcon />}
                                  variant="ghost" colorScheme="red" size="xs"
                                  onClick={() => { setRemoveNodeTargetId(node.id); setConfirmRemoveNode(true); }}
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </HStack>

                        {!node.isMain && (
                          <Collapse in={isExpanded} animateOpacity>
                            <Box bg="green.50" borderTop="1px solid" borderColor="green.100">
                              {nodeSuggestions.length === 0 ? (
                                <Text px={5} py={2} fontSize="xs" color="gray.400">
                                  No alternates found
                                </Text>
                              ) : (
                                <>
                                  {includedSuggestions.map((s) => (
                                    <HStack key={s.id} px={5} py={2.5} spacing={3}
                                      borderBottom="1px solid" borderColor="green.100"
                                      bg="green.100">
                                      <Box flex={1} minW={0}>
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.700" isTruncated>
                                          {s.name}
                                        </Text>
                                        {s.description && (
                                          <Text fontSize="xs" color="gray.500" isTruncated>{s.description}</Text>
                                        )}
                                      </Box>
                                      <Badge colorScheme="green" variant="solid" fontSize="9px" flexShrink={0}>
                                        Already included
                                      </Badge>
                                    </HStack>
                                  ))}
                                  {availableSuggestions.map((s) => (
                                    <HStack key={s.id} px={5} py={2.5} spacing={3}
                                      borderBottom="1px solid" borderColor="warning.100" bg={'warning.100'}
                                      _hover={{ bg: 'warning.100' }} transition="background 0.1s">
                                      <Box flex={1} minW={0}>
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.800" isTruncated>
                                          {s.name}
                                        </Text>
                                        {s.description && (
                                          <Text fontSize="xs" color="gray.500" isTruncated>{s.description}</Text>
                                        )}
                                      </Box>
                                      <Tooltip label="Add to group and generate all pairs" hasArrow>
                                        <Button size="xs" colorScheme="warning" variant="solid"
                                          leftIcon={<LuPlus />}
                                          isLoading={addingNodeId === s.id}
                                          isDisabled={addingNodeId !== null}
                                          onClick={() => addNodeToGroup(s)}>
                                          Include
                                        </Button>
                                      </Tooltip>
                                    </HStack>
                                  ))}
                                </>
                              )}
                            </Box>
                          </Collapse>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* RIGHT: Pair matrix */}
              <Box flex={1} display="flex" flexDirection="column" overflow="hidden">

                <HStack px={5} py={3} borderBottom="1px solid" borderColor="gray.100"
                  justify="space-between" bg="gray.50">
                  <HStack spacing={3}>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">Overall Stats</Text>
                    {pairs.length > 0 && (
                      <HStack spacing={2} fontSize="xs" color="gray.500">
                        {existingCount > 0 && (
                          <HStack spacing={1}>
                            <Text>Mapped</Text>
                            <Badge colorScheme="green" fontSize="12px" variant="solid">{existingCount}</Badge>
                          </HStack>
                        )}
                        {checkedNewCount > 0 && (
                          <HStack spacing={1}>
                            <Text>Newly added</Text>
                            <Badge colorScheme="orange" fontSize="12px" variant="solid">{checkedNewCount}</Badge>
                          </HStack>
                        )}
                        {pairsToDelete.length > 0 && (
                          <HStack spacing={1}>
                            <Text>Pending removal</Text>
                            <Badge colorScheme="red" fontSize="12px" variant="solid">{pairsToDelete.length}</Badge>
                          </HStack>
                        )}
                        {uncheckedCount > 0 && (
                          <HStack spacing={1}>
                            <Text>Unmapped</Text>
                            <Badge colorScheme="gray" fontSize="12px" variant="solid">{uncheckedCount}</Badge>
                          </HStack>
                        )}
                      </HStack>
                    )}
                  </HStack>
                  {pairs.some((p) => !p.exists) && (
                    <HStack spacing={2}>
                      <Button size="sm" variant="solid" colorScheme="green" leftIcon={<FaListCheck />}
                        onClick={() => toggleAllNewPairs(true)} isDisabled={allNewChecked}>
                        Select All
                      </Button>
                      <Button size="sm" variant="solid" colorScheme="red" leftIcon={<RiListCheck2 />}
                        onClick={() => toggleAllNewPairs(false)} isDisabled={allNewUnchecked}>
                        Reset
                      </Button>
                    </HStack>
                  )}
                </HStack>

                <Box overflowY="auto" flex={1}>
                  {pairs.length === 0 ? (
                    <VStack py={16} color="gray.400" spacing={3}>
                      <Icon as={FiPackage} boxSize={9} />
                      <Text fontSize="sm">No pairs yet</Text>
                      <Text fontSize="xs" textAlign="center" maxW="280px">
                        Search and add a part above — pairs appear instantly
                      </Text>
                    </VStack>
                  ) : (
                    nodes.map((fromNode) => {
                      const nodePairs = pairs.filter((p) => p.from_id === fromNode.id);
                      if (nodePairs.length === 0) return null;

                      const isMainFromNode = fromNode.id === id;

                      return (
                        <Box key={fromNode.id}>
                          <HStack px={5} py={2}
                            bg={fromNode.isMain ? 'blue.50' : 'gray.100'}
                            borderBottom="1px solid"
                            borderColor={fromNode.isMain ? 'blue.100' : 'gray.200'}>
                            <Text fontSize="xs" fontWeight="bold"
                              color={fromNode.isMain ? 'blue.600' : 'gray.600'}
                              textTransform="uppercase" letterSpacing="wide">
                              {fromNode.name}
                            </Text>
                            <Text fontSize="xs" color="gray.400">→</Text>
                            <Text fontSize="xs" color="gray.400">
                              {nodePairs.filter((p) => p.enabled).length} out of {nodePairs.length} Mapped
                            </Text>
                          </HStack>
                          {nodePairs.map((pair) => {
                            const isExistingMainPair = pair.exists && isMainFromNode;
                            const isExistingLockedPair = pair.exists && !isMainFromNode;
                            const isClickable = !pair.exists || isExistingMainPair;

                            return (
                              <HStack key={pair.key} px={5} py={3} spacing={4}
                                borderBottom="1px solid" borderColor="gray.100"
                                bg={
                                  !pair.enabled
                                    ? 'red.50'
                                    : pair.exists
                                      ? 'gray.50'
                                      : 'white'
                                }
                                _hover={{
                                  bg: isClickable
                                    ? (pair.enabled ? (pair.exists ? 'gray.100' : 'blue.50') : 'red.100')
                                    : undefined,
                                }}
                                transition="background 0.1s"
                                cursor={isClickable ? 'pointer' : 'default'}
                                onClick={() => isClickable && togglePair(pair.key)}>

                                {/* Checkbox */}
                                <Box onClick={(e) => e.stopPropagation()} flexShrink={0}>
                                  {isExistingLockedPair ? (
                                    <Tooltip label="This mapping is managed by the other part — cannot be changed here" hasArrow placement="right">
                                      <span>
                                        <Checkbox isChecked={pair.enabled} colorScheme="green" size="md"
                                          isReadOnly cursor="not-allowed"
                                          sx={{ '& .chakra-checkbox__control': { cursor: 'not-allowed' } }}
                                        />
                                      </span>
                                    </Tooltip>
                                  ) : isExistingMainPair ? (
                                    <Tooltip
                                      label={pair.enabled ? 'Uncheck to remove this mapping' : 'Re-check to keep this mapping'}
                                      hasArrow placement="right"
                                    >
                                      <span>
                                        <Checkbox isChecked={pair.enabled}
                                          colorScheme={pair.enabled ? 'green' : 'red'}
                                          size="md" onChange={() => togglePair(pair.key)}
                                        />
                                      </span>
                                    </Tooltip>
                                  ) : (
                                    <Checkbox isChecked={pair.enabled} colorScheme="orange"
                                      size="md" onChange={() => togglePair(pair.key)}
                                    />
                                  )}
                                </Box>

                                <Badge colorScheme={pair.from_id === mainNode?.id ? 'blue' : 'gray'}
                                  variant="subtle" fontSize="xs" flexShrink={0} minW="80px" textAlign="center">
                                  {pair.from_part}
                                </Badge>
                                <Text color="gray.400" fontSize="sm" flexShrink={0}>→</Text>
                                <Badge colorScheme={pair.to_id === mainNode?.id ? 'blue' : 'gray'}
                                  variant="subtle" fontSize="xs" flexShrink={0} minW="80px" textAlign="center">
                                  {pair.to_part}
                                </Badge>

                                {/* Remark input */}
                                <Box w="200px" flexShrink={0} onClick={(e) => e.stopPropagation()}>
                                  {isExistingLockedPair ? (
                                    <Text fontSize="sm" color="gray.400" isTruncated>{pair.remark || '—'}</Text>
                                  ) : (
                                    <Input
                                      placeholder="Remark (optional)"
                                      size="sm"
                                      borderRadius="md"
                                      isDisabled={!pair.enabled}
                                      defaultValue={pair.remark}
                                      onChange={(e) => debouncedPairRemark(pair.key, e.target.value)}
                                    />
                                  )}
                                </Box>

                                {/* Doc upload */}
                                <Box w="220px" flexShrink={0} onClick={(e) => e.stopPropagation()}>
                                  {isExistingLockedPair ? (
                                    pair.alt_ref_doc
                                      ? <Text fontSize="xs" color="blue.400" isTruncated>📎 {pair.alt_ref_doc.split('/').pop()}</Text>
                                      : <Text fontSize="xs" color="gray.300">—</Text>
                                  ) : (
                                    <PairDocUpload
                                      existingUrl={pair.alt_ref_doc}
                                      isDisabled={!pair.enabled}
                                      onValueChange={(url) => {
                                        setPairs((prev) =>
                                          prev.map((p) => p.key === pair.key ? { ...p, alt_ref_doc: url ?? undefined } : p)
                                        );
                                      }}
                                    />
                                  )}
                                </Box>

                                {/* Status badge */}
                                <Box flexShrink={0} w="110px" textAlign="right">
                                  {isExistingMainPair && !pair.enabled ? (
                                    <Badge colorScheme="red" fontSize="xs" variant="solid">Pending Removal</Badge>
                                  ) : !pair.enabled ? (
                                    <Badge colorScheme="red" fontSize="xs" variant="subtle">Not Mapped</Badge>
                                  ) : pair.exists ? (
                                    <Badge colorScheme="green" fontSize="xs" variant="subtle">Mapped</Badge>
                                  ) : (
                                    <Badge colorScheme="orange" fontSize="xs" variant="subtle">Newly Added</Badge>
                                  )}
                                </Box>
                              </HStack>
                            );
                          })}
                        </Box>
                      );
                    })
                  )}
                </Box>

                <Box px={5} py={4} borderTop="1px solid" borderColor="gray.200" bg="gray.50">
                  <HStack justify="space-between">
                    <Tooltip label={!canSave ? 'No changes to save' : ''} hasArrow isDisabled={canSave}>
                      <Box>
                        <Button colorScheme="green" size="sm" leftIcon={<FiSave />}
                          isDisabled={!canSave} onClick={() => setConfirmSave(true)} minW="160px">
                          {saveLabel}
                        </Button>
                      </Box>
                    </Tooltip>
                  </HStack>
                </Box>
              </Box>
            </HStack>
          </Box>
        </LoadingOverlay>

        <ConfirmationPopup
          isOpen={confirmSave}
          onClose={() => setConfirmSave(false)}
          onConfirm={handleConfirmSave}
          headerText="Save Mappings"
          bodyText={(() => {
            const parts: string[] = [];
            if (checkedNewCount > 0) parts.push(`Add ${checkedNewCount} new pair${checkedNewCount !== 1 ? 's' : ''}`);
            if (pairsToDelete.length > 0) parts.push(`Remove ${pairsToDelete.length} pair${pairsToDelete.length !== 1 ? 's' : ''}`);
            if (updatedExistingPairs.length > 0) parts.push(`Update ${updatedExistingPairs.length} existing pair${updatedExistingPairs.length !== 1 ? 's' : ''}`);
            return (parts.length > 0 ? parts.join(', ') : 'Save changes') + '?';
          })()}
        />

        <ConfirmationPopup
          isOpen={confirmRemoveNode}
          onClose={() => { setConfirmRemoveNode(false); setRemoveNodeTargetId(null); }}
          onConfirm={handleConfirmRemoveNode}
          headerText="Remove from Group"
          bodyText="Remove this part from the group? All pairs involving this part will also be removed."
        />

        <PartNumberModal
          isOpen={isNewSpareModalOpen}
          onClose={handleCloseSpareModal}
          createdInputValue={newSpareName}
        />
      </Stack>
    </SlideIn>
  );
};

export default AssignAlternateParts;
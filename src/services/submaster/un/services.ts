import { UseQueryOptions, useQuery } from 'react-query';

import { ListPayload, zListPayload } from '../schema';
import { fetchData } from '../service';
import {
  UNDetailsPayload,
  UnIndexPayload,
  zUnDetailsPayload,
  zUnIndexPayload,
} from './schema';

import { endPoints } from '@/services/submaster/service';

type UseUnIndexItemsQueryOptions = UseQueryOptions<UnIndexPayload>;
type UseUNListQueryOptions = UseQueryOptions<ListPayload>;
type UseUNDetailsQueryOptions = UseQueryOptions<UNDetailsPayload>;

export const useUnIndex = (queryOptions: UseUnIndexItemsQueryOptions = {}) =>
  useQuery({
    queryKey: 'unIndex',
    queryFn: () => fetchData(endPoints.index.un, zUnIndexPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useUNList = (queryOptions: UseUNListQueryOptions = {}) =>
  useQuery({
    queryKey: 'unList',
    queryFn: () => fetchData(endPoints.list.un, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

  
  export const useUNDetails = (
    id: number | string,
    queryOptions: UseUNDetailsQueryOptions = {}
  ) =>
    useQuery({
      queryKey: ['unDetails', id],
      queryFn: () => fetchData(endPoints.info.un.replace(":id", id), zUnDetailsPayload),
      //staleTime: 5 * 60 * 1000, // 5 minutes
      //cacheTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!id,
      retry: 2,
      refetchOnWindowFocus: false,
      ...queryOptions,
    });

import { UseQueryOptions, useQuery } from 'react-query';
import {
  ListPayload,
  zListPayload
} from '../schema';

import { fetchData } from '../service';

const endPoints = import.meta.env.VITE_API_ENDPOINTS ? JSON.parse(import.meta.env.VITE_API_ENDPOINTS) : {};

type UseBankListQueryOptions = UseQueryOptions<ListPayload>;


export const useBankList = (
  queryOptions: UseBankListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'bankList',
    queryFn: () => fetchData( endPoints.list.bank , zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
    onError: (error) => {
      console.error('Error fetching bin location list:', error);
      queryOptions.onError?.(error);
    },
  });
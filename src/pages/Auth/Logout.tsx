import { useEffect } from 'react';

import { Center, Spinner } from '@chakra-ui/react';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { useAuthContext } from '@/services/auth/AuthContext';

const Logout = () => {
  const { updateToken } = useAuthContext();
  const navigate = useNavigate();
  const queryCache = useQueryClient();

  useEffect(() => {
    updateToken(null);
    queryCache.clear();
    navigate('/login');
  }, [queryCache, navigate, updateToken]);
  return (
    <Center flex={1}>
      <Spinner />
    </Center>
  );
};

export default Logout;

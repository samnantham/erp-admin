import React, { createContext, useContext, useState } from 'react';

interface UserContextType {
  userInfo: any;
  setUserInfo: (info: any) => void;
  isProfileLoading: boolean;
  setIsProfileLoading: (loading: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true); // true by default — assume loading on mount

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, isProfileLoading, setIsProfileLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserContext must be used within a UserProvider');
  return context;
};
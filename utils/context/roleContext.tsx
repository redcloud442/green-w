"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type RoleContextType = {
  role: string;
  userName: string;
  teamMemberId: string;
  mobileNumber: string;
  email: string;
  setRole: ({
    role,
    userName,
    teamMemberId,
    mobileNumber,
    email,
  }: {
    role: string;
    userName: string;
    teamMemberId: string;
    mobileNumber: string;
    email: string;
  }) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({
  children,
  initialRole,
  initialUserName,
  initialTeamMemberId,
  initialMobileNumber,
  initialEmail,
}: {
  children: ReactNode;
  initialRole: string;
  initialUserName: string;
  initialTeamMemberId: string;
  initialMobileNumber: string;
  initialEmail: string;
}) => {
  const [state, setState] = useState({
    role: initialRole,
    userName: initialUserName,
    teamMemberId: initialTeamMemberId,
    mobileNumber: initialMobileNumber,
    email: initialEmail,
  });

  const setRole = ({
    role,
    userName,
    teamMemberId,
    mobileNumber,
    email,
  }: {
    role: string;
    userName: string;
    teamMemberId: string;
    mobileNumber: string;
    email: string;
  }) => {
    setState({ role, userName, teamMemberId, mobileNumber, email });
  };

  return (
    <RoleContext.Provider
      value={{
        role: state.role,
        userName: state.userName,
        teamMemberId: state.teamMemberId,
        mobileNumber: state.mobileNumber,
        email: state.email,
        setRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within a RoleProvider");
  return context;
};

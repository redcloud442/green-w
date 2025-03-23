"use client";

import {
  alliance_member_table,
  alliance_referral_link_table,
  user_table,
} from "@prisma/client";
import { createContext, ReactNode, useContext, useState } from "react";

type RoleContextType = {
  profile: user_table;
  teamMemberProfile: alliance_member_table;
  referral: alliance_referral_link_table;
  setProfile: ({ profile }: { profile: user_table }) => void;
  setTeamMemberProfile: ({
    teamMemberProfile,
  }: {
    teamMemberProfile: alliance_member_table & user_table;
  }) => void;
  setReferral: ({
    referral,
  }: {
    referral: alliance_referral_link_table;
  }) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({
  children,
  initialProfile,
  initialTeamMemberProfile,
  initialReferral,
}: {
  children: ReactNode;
  initialProfile: user_table;
  initialTeamMemberProfile: alliance_member_table;
  initialReferral: alliance_referral_link_table;
}) => {
  const [state, setState] = useState({
    profile: initialProfile,
    teamMemberProfile: initialTeamMemberProfile,
    referral: initialReferral,
  });

  const setProfile = ({ profile }: { profile: user_table }) => {
    setState((prev) => ({ ...prev, profile }));
  };

  const setTeamMemberProfile = ({
    teamMemberProfile,
  }: {
    teamMemberProfile: alliance_member_table & user_table;
  }) => {
    setState((prev) => ({
      ...prev,
      teamMemberProfile,
    }));
  };

  const setReferral = ({
    referral,
  }: {
    referral: alliance_referral_link_table;
  }) => {
    setState((prev) => ({
      ...prev,
      referral,
    }));
  };

  return (
    <RoleContext.Provider
      value={{
        teamMemberProfile: state.teamMemberProfile,
        referral: state.referral,
        setTeamMemberProfile,
        setReferral,
        profile: state.profile,
        setProfile,
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

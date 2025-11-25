import { useEffect, useState } from 'react';
import { DatabaseMatchProfile, PopulatedDatabaseChat, Message } from '../types/types';
import { ObjectId } from 'mongodb';
import { getMatchProfile } from '../services/matchProfileService';

interface ChatParticipantData {
  _id: string | ObjectId;
  username: string;
  avatarUrl?: string;
}

interface MessageWithUser extends Message {
  user?: {
    avatarUrl?: string;
  };
}

interface UseMatchedUserProfileResult {
  otherProfile: DatabaseMatchProfile | null;
  otherParticipant: string | null;
  otherAvatar?: string;
  isGroupChat: boolean;
}

export default function useMatchedUserProfile(
  selectedChat: PopulatedDatabaseChat | null,
  currentUsername: string,
): UseMatchedUserProfileResult {
  const [otherProfile, setOtherProfile] = useState<DatabaseMatchProfile | null>(null);

  const isGroupChat =
    selectedChat?.chatType === 'group' || (selectedChat?.participants?.length ?? 0) > 2;

  const otherParticipant: string | null = !isGroupChat
    ? (selectedChat?.participants.find(p => p !== currentUsername) ??
      selectedChat?.participants[0] ??
      null)
    : null;

  // -------- Avatar resolution ----------
  let otherAvatar: string | undefined;

  if (!isGroupChat && selectedChat && otherParticipant) {
    const participantsData = selectedChat.participantsData as ChatParticipantData[] | undefined;

    const match = participantsData?.find(p => p.username === otherParticipant);
    otherAvatar = match?.avatarUrl;

    if (!otherAvatar) {
      for (const msg of selectedChat.messages as MessageWithUser[]) {
        if (msg.msgFrom === otherParticipant && msg.user?.avatarUrl) {
          otherAvatar = msg.user.avatarUrl;
          break;
        }
      }
    }
  }

  // -------- Fetch MatchProfile (safe, isolated) ----------
  useEffect(() => {
    const loadProfile = async () => {
      if (!selectedChat || isGroupChat || !otherParticipant) {
        setOtherProfile(null);
        return;
      }

      const participantsData = selectedChat.participantsData as ChatParticipantData[] | undefined;

      const match = participantsData?.find(p => p.username === otherParticipant);
      const userId = match?._id;

      if (!userId) {
        setOtherProfile(null);
        return;
      }

      try {
        const profile = await getMatchProfile(String(userId));

        if ('error' in profile) {
          setOtherProfile(null);
        } else {
          setOtherProfile(profile);
        }
      } catch {
        setOtherProfile(null);
      }
    };

    loadProfile();
  }, [selectedChat, isGroupChat, otherParticipant]);

  return {
    otherProfile,
    otherParticipant,
    otherAvatar,
    isGroupChat,
  };
}

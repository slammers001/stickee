import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'stickee_user_id';

export const getUserId = (): string => {
  // Try to get existing user ID from localStorage
  let userId = localStorage.getItem(USER_ID_KEY);
  
  // If no user ID exists, create a new one
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
};

export const getCurrentUser = () => {
  const userId = getUserId();
  return {
    id: userId,
    isGuest: true,
    displayName: `User ${userId.substring(0, 8)}` // Show first 8 chars of UUID
  };
};

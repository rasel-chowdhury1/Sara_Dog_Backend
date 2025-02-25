import { PetProfile } from "../PetProfile/PetProfile.models";
import { BlockUser } from "./BlockedUser.model";


const blockUser = async (user_id: string , block_user_id: any) => {
  // Check if the user is already blocked
  const existingBlock = await BlockUser.findOne({ user_id });

  if (existingBlock && existingBlock.blocked_users.includes(block_user_id)) {
    throw new Error('User is already blocked');
  }

  // Add the user to the blocked list
  const blockEntry = await BlockUser.findOneAndUpdate(
    { user_id },
    { $addToSet: { blocked_users: block_user_id } },
    { new: true, upsert: true },
  );

  return blockEntry;
};



const unblockUser = async (user_id: string, unblock_user_id: string) => {
  let blockEntry = await BlockUser.findOneAndUpdate(
    { user_id },
    { $pull: { blocked_users: unblock_user_id } },
    { new: true },
  );


  if (!blockEntry) {
    throw new Error('User is not blocked or does not exist');
  }

  return blockEntry;
};

const getBlockedUsers = async (user_id: string) => {
  const blockEntry = await BlockUser.findOne({ user_id })
    .populate('blocked_users', 'fullName email')
    .exec(); // Ensure the query is executed

  console.log('=== block entry = >>  ', blockEntry);

  if (!blockEntry) return [];

  // Now, for each blocked user, fetch their pet profile
  const blockedUsersWithPet = await Promise.all(
    blockEntry.blocked_users.map(async (user: any) => {
      // Fetch pet profile based on the user (assuming pet profile has a reference to user)
      const petProfile = await PetProfile.findOne({ userId: user._id }).select(
        'userId name image',
      );
      return {
        userId: petProfile?.userId,
        fullName: user.fullName,
        email: user.email,
        petName: petProfile?.name,
        petImage: petProfile?.image,
      };
    }),
  );

  return blockedUsersWithPet;
};


export const BlockUserService = {
    blockUser,
    unblockUser,
    getBlockedUsers
}
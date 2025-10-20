import mongoose from 'mongoose';
import { BlockUser } from '../BlockedUser/BlockedUser.model';
import { Message } from '../Message/Message.models';
import { PetProfile } from '../PetProfile/PetProfile.models';
import { User } from '../user/user.models';
import { TChat } from './Chat.interface';
import { Chat } from './Chat.models';



// Convert string to ObjectId
const toObjectId = (id: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(id);

const addNewChat = async (
  // file: Express.Multer.File,
  data: TChat,
) => {
  // Check if the creator exists
  const isCreatorExist = await User.findOne({ _id: data?.createdBy });

  if (!isCreatorExist) {
    throw new Error('Creator not found');
  }

  // Check if all users in the chat exist
  const foundUsers = await User.find({ _id: { $in: data?.users } });
  if (foundUsers.length !== data?.users.length) {
    throw new Error('One or more users not found');
  }

  // **Check for existing individual chat (not a group chat)**
  if (!data?.isGroupChat) {
    const existingChat = await Chat.findOne({
      users: { $all: data.users, $size: 2 }, // Ensure both users exist in the chat
      isGroupChat: false, // Must be an individual chat
    });

    // const { deletedFor, users } = existingChat;

    if (
      existingChat
    ) {
      // Create the chat in the database
      const result = await Chat.findByIdAndUpdate(
        existingChat._id,
        { deletedFor: [] },
        { new: true },
      );
      return result;
    }
    if (existingChat) {
      throw new Error('Chat between these users already exists');
      // return 'Chat between these users already exists';
    }
  }

  // If it's a group chat, perform additional validations
  if (data?.isGroupChat === true) {
    if (!data?.groupName) {
      throw new Error('Group Name is required');
    }

    // if (!file) {
    //   throw new Error('Group Profile Picture is required');
    // }
    // // Assign the group profile picture URL
    // const imageUrl = file.path.replace('public\\', '');
    // data.groupProfilePicture = imageUrl;

    // if (!data?.groupBio) {
    //   throw new Error('Group Bio is required');
    // }

    if (!data?.groupAdmins || data.groupAdmins.length === 0) {
      throw new Error('Group Admins are required');
    }

    // Check if all group admins exist
    const foundAdmins = await User.find({ _id: { $in: data?.groupAdmins } });
    if (foundAdmins.length !== data?.groupAdmins.length) {
      throw new Error('One or more group admins not found');
    }
  }

  // Create the chat in the database
  const result = await Chat.create(data);
  return result;
};

const leaveUserFromSpecific = async (payload: any) => {
  const { chatId, userId } = payload; // Expect chatId and userId in the payload

  // Check if chatId is provided
  if (!chatId) {
    throw new Error('Chat ID is required'); // Throw an error for the caller to handle
  }

  // Check if userId is provided
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Find the chat
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  // Check if the user is part of the chat
  if (!chat.users.includes(userId)) {
    throw new Error('You are not part of this chat');
  }

  // Remove the user from the chat
  chat.users = chat.users.filter((user) => user.toString() !== userId);

  // If the user is an admin in a group chat, remove them from groupAdmins
  if (chat.isGroupChat) {
    chat.groupAdmins = chat.groupAdmins.filter(
      (admin) => admin.toString() !== userId,
    );
  }


  // Save the updated chat
  await chat.save();

  // Return success message
  return { message: 'User has left the chat successfully' };
};

const getUserChats = async (userId: string): Promise<TChat[]> => {
  const result = await Chat.find({
    users: {
      $in: [userId],
    },
  })
    .populate('lastMessage')
    .populate('lastMessage')
    .populate('createdBy')
    .populate('groupAdmins')
    .populate('users')
    .sort({ createdAt: -1 });

  // console.log("====== service file of get user chats =>>>>> ", result )
  // Filter out chats where the userId exists in deletedFor
  const filteredResult = result.filter(
    (chat) => !chat.deletedFor.includes(toObjectId(userId)),
  );

  // filteredResult = result.filter((chat) => !chat.blockedUsers.includes(userId));

  // Step 2: Enrich the result with pet images for each user
  const enrichedResult = await Promise.all(
    filteredResult.map(async (chat) => {
      const enrichedChat: any = chat.toObject(); // Convert Mongoose document to plain object

      // Check if the chat has users
      if (chat.users && chat.users.length > 0) {
        enrichedChat.users = await Promise.all(
          chat.users.map(async (user: any) => {
            // Fetch the pet profile for the user
            const petProfile = await PetProfile.findOne({
              userId: user._id,
            }).select('name image'); // Select only name and image from PetProfile

            // Return the user with the added petImage field
            return {
              _id: user._id, // Access the user's ID directly
              fullName: user.fullName || user._doc?.fullName,
              email: user.email || user._doc?.email,
              image: user.image || user._doc?.image,
              role: user.role || user._doc?.role,
              isSupported: user.isSupported || user._doc?.isSupported,
              isHero: user.isHero || user._doc?.isHero,
              petImage: petProfile ? petProfile.image : null, // Default to null if no pet profile
              petName: petProfile ? petProfile.name : null, // Add petName if available
            };
          }),
        );
      } else {
        enrichedChat.users = []; // Default to empty array if no users
      }

      return enrichedChat; // Return enriched chat
    }),
  );

  return enrichedResult;
};

const getChatById = async (id: string): Promise<TChat | null> => {
  return await Chat.findById(id)
    .populate('lastMessage users')
    .populate('lastMessage')
    .populate('createdBy')
    .populate('groupAdmins');
};

const updateUnreadCounts = async (
  chatId: string,
  userId: string,
  unreadCount: number,
): Promise<TChat | null> => {
  return await Chat.findByIdAndUpdate(
    chatId,
    { [`unreadCountes.${userId}`]: unreadCount },
    { new: true },
  );
};

const updateChatById = async (
  chatId: string,
  // file: Express.Multer.File,
  data: TChat,
): Promise<TChat | null> => {
  const isChatExist = await Chat.findById(chatId);
  if (!isChatExist) {
    throw new Error('Chat not found');
  }
  // if (data?.isGroupChat === true) {
  //   if (file) {
  //     const ImageUrl = file.path.replace('public\\', '');
  //     data.groupProfilePicture = ImageUrl;
  //   }
  // }

  const result = await Chat.findByIdAndUpdate(chatId, data, {
    new: true,
  });
  return result;
};

//Block a user in a chat
const blockUser = async (
  chatId: string,
  userId: string,
  blockUserId: string,
): Promise<TChat | null> => {
  const chat = await Chat.findById(chatId);


  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!chat.users.includes(toObjectId(userId))) {
    throw new Error('User is not part of this chat');
  }

  if (!chat.users.includes(toObjectId(blockUserId))) {
    throw new Error('User is not part of this chat');
  }


  // Add user to blocked list
  if (chat.blockedUsers.includes(toObjectId(blockUserId))) {
    throw new Error('User is already blocked.');
  }

  // console.log({ chat });

  // chat.blockedUsers.push(blockUserId);
  // console.log(
  //   '==== before if check deleted === ',
  //   chat.deletedFor.includes(userId),
  // );
  // if (!chat.deletedFor.includes(userId)) {
  //   console.log(
  //     '==== after check deleted === ',
  //     chat.deletedFor.includes(userId),
  //   );
  //   chat.deletedFor.push(userId);
  // }

  // console.log(
  //   '====befor if check deleted === ',
  //   chat.deletedFor.includes(userId),
  // );
  // if (!chat.deletedFor.includes(blockUserId)) {
  //   console.log(
  //     '==== after check block === ',
  //     chat.deletedFor.includes(blockUserId),
  //   );
  //   chat.deletedFor.push(blockUserId);
  // }

  // ✅ Delete messages associated with this chatId
  await Message.deleteMany({ chat: chatId });

  await BlockUser.findOneAndUpdate(
    { user_id: userId },
    { $addToSet: { blocked_users: blockUserId } },
    { new: true, upsert: true },
  );

  return await Chat.findByIdAndDelete(chatId);

  // await chat.save();
  // return chat;
};

// Unblock a user in a chat
const unblockUser = async (
  chatId: string,
  userId: string,
  blockUserId: string,
) => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!chat.users.includes(toObjectId(userId))) {
    throw new Error('User is not part of this chat');
  }

  if (!chat.users.includes(toObjectId(blockUserId))) {
    throw new Error('User is not part of this chat');
  }

  if (!chat.users.includes(toObjectId(blockUserId))) {
    throw new Error('User is not part of this chat');
  }

  // Remove user from blocked list
  chat.blockedUsers = chat.blockedUsers.filter(
    (id) => id.toString() !== blockUserId,
  );

  chat.deletedFor = [];

  await chat.save();
  return chat;
};

// Delete a chat for a specific user (soft delete)
const deleteChatForUser = async (
  chatId: string,
  userId: string,
): Promise<TChat | null> => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!chat.users.includes(toObjectId(userId))) {
    throw new Error('User is not part of this chat');
  }

  // Add user to deletedFor list
  if (!chat.deletedFor.includes(toObjectId(userId))) {
    chat.deletedFor.push(toObjectId(userId));
  }

  // If all users delete the chat, remove it permanently
  if (chat.deletedFor.length === chat.users.length) {
    await Chat.findByIdAndDelete(chatId);
    return null;
  }

  await chat.save();
  return chat;
};

const deleteChat = async (id: string): Promise<TChat | null> => {
  return await Chat.findByIdAndDelete(id);
};

export const ChatService = {
  addNewChat,
  leaveUserFromSpecific,
  getUserChats,
  getChatById,
  updateUnreadCounts,
  deleteChat,
  updateChatById,
  blockUser,
  unblockUser,
  deleteChatForUser,
};

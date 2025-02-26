/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import getUserDetailsFromToken from './app/helpers/getUserDetailsFromToken';
import { Chat } from './app/modules/Chat/Chat.models';
import { Message } from './app/modules/Message/Message.models';
import { PetProfile } from './app/modules/PetProfile/PetProfile.models';
import { User } from './app/modules/user/user.models';
import { UserProfile } from './app/modules/UserProfile/UserProfile.models';
import AppError from './app/error/AppError';
import { error } from 'console';

async function getChatById(chatId: string) {
  try {
    const chat = await Chat.findById(chatId).populate('users').exec();
    if (!chat) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }
    return chat;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error; // Rethrow to handle it in the calling function
  }
}

const initializeSocketIO = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  // Online users
  let onlineUsers: string[] = [];
  const connectedSocket = new Map();

  try {
    io.on('connection', async (socket) => {
      // console.log({ socket });
      // console.log('room -> ', socket.rooms);
      console.log('connected', socket?.id);

      //----------------------user token get from front end-------------------------//

      // console.log("socket -> ", socket)

      const token =
        socket.handshake.auth.token ||
        (socket.handshake?.headers?.token as string);

      console.log('konojhoi', socket.handshake);

      if (!token) {
        socket.emit('io-error', {
          success: false,
          message: 'please provide token... ',
        });
        socket.disconnect();
        return;
        // console.error('Error fetching chat details:');
        // throw new AppError(httpStatus.UNAUTHORIZED, 'you are not authorized!');
      }

      // // console.log({ token });
      // //----------------------check Token and return user details-------------------------//
      const user: any = await getUserDetailsFromToken(token);
      console.log('======== user ==== ', user);

      const userProfile: any = await PetProfile.findOne({userId: user._id.toString()}).select("name")

      
      console.log("======== user profile ==== ", userProfile)

      // console.log({ user });

      // console.log({ user });
      if (!user) {
        socket.emit('io-error', { success: false, message: 'invalid Token' });
        socket.disconnect();
        return;
      }

      // connectedSocket.set(user._id.toString(), socket);

      // console.log({ connectedSocket });

      try {
        socket.on('join', (data) => {
          console.log('....... chat id ........');
          console.log({ data });
          socket.join(data);
          // console.log('socket id from join ->', { userId });
          // if (!socket.rooms.has(userId)) {
          //   console.log({ userId });

          //   console.log('join data -> ', socket.join);
          //   if (!onlineUsers.includes(userId)) {
          //     onlineUsers.push(userId);
          //   }
          // }
          const userId = user._id.toString();

          if (!onlineUsers.includes(userId)) {
            onlineUsers.push(userId);
          }

          // onlineUsers.forEach((user) => {
          //   io.to(user).emit('online-users-updated', onlineUsers);
          // });
          io.emit('online-users-updated', onlineUsers);

          // console.log('Online Users', onlineUsers);
        });

        socket.on('send-new-message', async (message, callback) => {
          console.log('===== new message ====>', { message });

          try {
            // Assuming `getChatById` fetches the chat object including the users array
            const chat = await getChatById(message.chat);

            console.log("===== chat messag ==>>>>>> ",{ chat });
            // console.log(chat.users);
            let newMessage: any;
            let userData;

            if (chat.blockedUsers.includes(user._id.toString())) {
              // console.log('user is blocked ======>>>>>>> ');

              socket.emit(
                'io-error',
                "You have been blocked. You can't send messages.",
              );
              callback({
                success: false,
                message: "You have been blocked. You can't send messages.",
              });
              return 

              // console.log("after excution ===>>>>>>>> ")
            }

              if (chat) {
                newMessage = await Message.create(message);
                console.log('====== created message ==>>>>> ', { newMessage });
                

                if (message?.sender === null) {
                } else {
                  let receiver;

                  if(chat.users.length === 2){

                    if (chat.users[0]._id.toString() === user._id.toString()){
                      receiver = chat.users[1]._id.toString();
                    }
                    else{
                      receiver = chat.users[0]._id.toString();
                    }


                  }
                  let deletedFor = chat.deletedFor;
                  if(receiver){
                    deletedFor = chat.deletedFor.filter(
                      (id) => id.toString() !== receiver,
                    );
                  }
                  userData = await User.findById(message?.sender).select(
                    'image fullName',
                  );
                  await Chat.findByIdAndUpdate(message.chat, {
                    lastMessage: newMessage._id,
                    deletedFor
                  });
                }
                // console.log({ userData });
              }
            // console.log(message?.chat);
            const chatId = message?.chat;
            // console.log({ ...message, userData });

            const petProfileData = await PetProfile.findOne({
              userId: message?.sender,
            });

            console.log({ petProfileData });

            message.name = petProfileData?.name;
            message.image = petProfileData?.image;

            console.log({ message });

            // console.log('new-message-received::', message.chat);
            // /socket.emit(`new-message-received::${message.chat}`, newMessage);
            callback({
              success: true,
              message: "Your message sent successfully.",
            });
            socket
              .to(chatId)
              .emit(`new-message-received::${message?.chat}`, message);
            socket.emit(`new-message-received::${message?.chat}`, message);

          } catch (error) {
            console.error('Error fetching chat details:', error);
            
          }
        });

        socket.on("isChatBlocked", (data, callback) => {
           const message = {
             success: true,
             message: 'chat is blocked...',
             data: data.chatId,
           };
            callback(message);

            console.log(`needRefresh::${data.userId}`);
            console.log("===message ====>>>>>>", message);
            io.emit(`needRefresh::${data.userId}`, {success: true, message: `${data.userId} need refresh.`})
            io.emit(`isChatBlocked::${data.chatId}`, message);
        })




        // Leave a chat room
        socket.on('leave', (chatId, callback) => {
          // console.log(`${socket.id} left room ${chatId}`);

          socket
            .to(chatId)
            .emit(`leave::${chatId}`, `${user.name} left from  this chat...`);
          socket.leave(chatId);
        });

        socket.on('read-all-messages', ({ chatId, users, readByUserId }) => {
          users.forEach((user: string) => {
            io.to(user).emit('user-read-all-chat-messages', {
              chatId,
              readByUserId,
            });
          });
        });

        socket.on('typing', (data, callback) => {
          const senderId = user._id.toString();
          let message = `${userProfile?.name} is `;
          // console.log('==== sender {id, name } of user === ', {
          //   senderId,
          //   message,
          //   data,
          // });

          if (data.status === true) {
            message += 'typing...';
            data.users.forEach((user: any) => {
              if (user._id !== senderId) {
                io.emit(`typing::${data.chatId.toString()}`, {
                  status: true,
                  writeId: senderId,
                  message,
                });
              }
            });
            callback({ success: true, writeId: senderId, message });
          } else if (data.status === false) {
            // message += 'stop typing...';
            data.users.forEach((user: any) => {
              if (user._id !== senderId) {
                io.emit(`typing::${data.chatId.toString()}`, {
                  status: true,
                  writeId: senderId,
                  message: '',
                });
              }
            });
            callback({ success: false, writeId: senderId, message });
          }
        });

        socket.on('logout', (userId) => {
          socket.leave(userId);
          onlineUsers = onlineUsers.filter((user) => user !== userId);

          onlineUsers.forEach((user) => {
            io.to(user).emit('online-users-updated', onlineUsers);
          });
        });

        //-----------------------Disconnect------------------------//
        socket.on('disconnect', () => {
          console.log('disconnect user ', socket.id);
        });
      } catch (error) {
        console.error('-- socket.io connection error --', error);
      }
    });
  } catch (error) {}

  return io;
};

export default initializeSocketIO;

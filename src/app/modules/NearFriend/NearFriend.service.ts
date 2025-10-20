import AppError from '../../error/AppError';
import { TUserProfile } from '../UserProfile/UserProfile.interface';
import { UserProfile } from '../UserProfile/UserProfile.models';

import httpStatus from 'http-status';
import AggregationQueryBuilder from '../../builder/AggregationQueryBuilder';
import { BlockUser } from '../BlockedUser/BlockedUser.model';
import { TPetProfile } from '../PetProfile/PetProfile.interface';
import { PetProfile } from '../PetProfile/PetProfile.models';

// const nearFriends = async (
//   userId: string,
//   query: Record<string, unknown>,
// ): Promise<{ meta: any; enrichedResults: any }> => {
//   console.log(userId);

//   // Step 1: Fetch the UserProfile to get the location
//   const userProfile = await UserProfile.findOne({ userId: userId });
//   if (!userProfile) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User profile not found');
//   }
//   if (!userProfile?.location) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User location not set yet');
//   }

//   const {
//     location: {
//       coordinates: [userLongitude, userLatitude],
//     },
//   } = userProfile;

//   // Step 2: Exclude the current user from the query
//   query.userId = { $ne: userId };

//   // Step 3: Query UserProfile for location-based filtering
//   const userQuery = new QueryBuilder(UserProfile, query)
//     .geoNear('location', [userLongitude, userLatitude], 10) // 10-mile radius
//     .filter(['name', 'address', 'email']) // Add necessary filterable fields
//     .sort()
//     .paginate()
//     .fields();

//   const meta = await userQuery.countTotal();
//   const result = await (userQuery.modelQuery as Aggregate<TUserProfile[]>);

//   // Step 4: Now query PetProfile with the same query filters (except location)
//   const petQuery = new QueryBuilder(PetProfile, query)
//     .filter([
//       'name',
//       'age',
//       'size',
//       'neuteredSpayed',
//       'howDoYouPlay',
//       'doYouLikeACrowd',
//       'playSizePreferences',
//       'locationPreferences',
//       'address',
//     ]) // Apply the filters for PetProfile
//     .sort()
//     .paginate()
//     .fields();

//   const petProfiles = await (petQuery.modelQuery as Aggregate<TPetProfile[]>);

//   // Step 5: Return the result enriched with PetProfiles and their data
//   const enrichedResults = result.map((user) => {
//     // Find associated PetProfile for each UserProfile
//     const petProfile = petProfiles.find(
//       (pet) => pet.userProfileId.toString() === user._id.toString(),
//     );

//     let message = '';
//     if (petProfile) {
//       // Set message based on matching filter values
//       if (petProfile.age === query.age)
//         message += `Age matches: ${petProfile.age} years. `;
//       if (petProfile.size === query.size)
//         message += `Size matches: ${petProfile.size}. `;
//       if (petProfile.neuteredSpayed === query.neuteredSpayed)
//         message += `Neutered/Spayed matches: ${petProfile.neuteredSpayed}. `;
//       if (petProfile.howDoYouPlay === query.howDoYouPlay)
//         message += `Play style matches: ${petProfile.howDoYouPlay}. `;
//       if (petProfile.doYouLikeACrowd === query.doYouLikeACrowd)
//         message += `Crowd preference matches: ${petProfile.doYouLikeACrowd}. `;
//       if (petProfile.playSizePreferences === query.playSizePreferences)
//         message += `Play size preference matches: ${petProfile.playSizePreferences}. `;
//       if (petProfile.locationPreferences === query.locationPreferences)
//         message += `Location preference matches: ${petProfile.locationPreferences}. `;
//       if (petProfile.address === query.address)
//         message += `Address matches: ${petProfile.address}. `;
//     } else {
//       message = 'No pet profile found for this user.';
//     }

//     return {
//       // Type assertion for user (casting to Document type)
//       ...(user as Document).toObject(),
//       petProfile: petProfile ? (petProfile as Document).toObject() : null, // Type assertion for petProfile
//       message: message || 'No matching data found for this pet profile.',
//     };
//   });

//   console.log({ meta, enrichedResults });

//   return { meta, enrichedResults };
// };

// export default nearFriends;

// ====== done ====

const nearFriends = async (
  userId: string,
  query: Record<string, unknown>,
): Promise<TUserProfile[] | any> => {
  console.log(userId);

  const userProfile = await UserProfile.findOne({ userId: userId }).populate(
    'petsProfileId',
  );

  console.log('----------- user profile ====== >>>>>> ', userProfile);
  if (!userProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'User profile not found');
  }
  if (!userProfile?.location) {
    throw new AppError(httpStatus.NOT_FOUND, 'User location not set yet');
  }

  const {
    location: {
      coordinates: [userLongitude, userLatitude],
    },
  } = userProfile;

  // Exclude the current user from results
  query.userId = { $ne: userId };

  const nearbyFriendsQuery = new AggregationQueryBuilder(UserProfile, query)
    .geoNear([userLongitude, userLatitude], 200) // 10-mile radius
    // .filter([])
    .addFields({ distanceInMiles: { $divide: ['$distanceInMiles', 1609.34] } }) // Convert meters to miles['$distanceOfFriend', 1609.34]
    .sort()
    .paginate();
  // .fields();
  const meta = await nearbyFriendsQuery.countTotal();
  let result = await nearbyFriendsQuery.execute();
  //  console.log('===== before populate result  === ', result);
  result = await UserProfile.populate(result, {
    path: 'userId petsProfileId ',
  });

  // console.log("===== result === ", result);

  // Step 4: Now query PetProfile with the same query filters (except location)
  const petQuery = new AggregationQueryBuilder(PetProfile, query)
    .filter([
      'name',
      'age',
      'size',
      'neuteredSpayed',
      'howDoYouPlay',
      'doYouLikeACrowd',
      'playSizePreferences',
      'locationPreferences',
      'address',
    ]) // Apply the filters for PetProfile
    .sort()
    .paginate()
    .fields();

  const petProfiles = await petQuery.execute();

  // console.log("=== pet query data ==== ", petProfiles)

  // console.log('result from userId friends ======>>>>>> ', userId);
  // console.log('result from near friends ======>>>>>> ', result);

  const BlockUserOfSpecificUser = await BlockUser.findOne({ user_id: userId });
  // console.log("==== specific user ___>>> ", userId)
  // console.log("==== block user of specific user ___>>> ", BlockUserOfSpecificeUser)

  // let filteredResult = result.filter(
  //   (friend) => friend.userId._id.toString() !== userId,
  // );

  // let filResult = filteredResult.filter((friend) =>
  //   !BlockUserOfSpecificeUser?.blocked_users?.includes(friend.userId._id),
  // );

  // console.log("==== filtered Result====>>>>> ", filteredResult)

  console.log(
    'Blocked Users of Specific User:',
    BlockUserOfSpecificUser?.blocked_users || [],
  );

  // Fetch blocked users for all friends in one query (OPTIMIZATION)
  const allBlockedUsers = await BlockUser.find({
    user_id: { $in: result.map((friend) => friend.userId._id) },
  }).lean();

  // Convert blocked users into a map for quick lookup
  const blockedUsersMap = new Map(
    allBlockedUsers.map((doc) => [
      doc.user_id.toString(),
      doc.blocked_users.map((id) => id.toString()),
    ]),
  );

  // Filter users based on block status
  let filteredResult = result.filter((friend) => {
    const friendId = friend.userId._id.toString();

    // Check if the current user has blocked this friend
    const isBlockedByMe = BlockUserOfSpecificUser?.blocked_users?.some(
      (blockedId) => blockedId.toString() === friendId,
    );

    // Check if this friend has blocked the current user
    const isBlockedByThem = blockedUsersMap.get(friendId)?.includes(userId);

    return !isBlockedByMe && !isBlockedByThem;
  });

  let filResult = filteredResult.filter(
    (friend) => friend.userId._id.toString() !== userId,
  );



  // Step 5: Return the result enriched with PetProfiles and their data
  const enrichedResults = filResult.map((user) => {
    // Find associated PetProfile for each UserProfile
    const petProfile = petProfiles.find(
      (pet) => pet.userId.toString() === user.userId._id.toString(),
    );



    // let message = '';
    // let totalMatchItems = 8;
    // let countMatch = 0;

    // if (petProfile) {
    //   // Set message based on matching filter values
    //   if (petProfile.age === userProfile?.petsProfileId?.age){
    //     countMatch++;
    //     if(!message) message += `Age matched.`;
    //   }
    //   if (petProfile.size === userProfile?.petsProfileId?.size) {
    //     countMatch++;
    //     if (!message) message += `Size matched.`;
    //   }
    //   if (
    //     petProfile.neuteredSpayed === userProfile?.petsProfileId?.neuteredSpayed
    //   ) {
    //     countMatch++;
    //     if (!message)
    //       message += `Neutered/Spayed matched.`;
    //   }
    //   if (
    //     petProfile.howDoYouPlay === userProfile?.petsProfileId?.howDoYouPlay
    //   ) {
    //     countMatch++;
    //     if (!message)
    //       message += `Play style matched.`;
    //   }
    //   if (
    //     petProfile.doYouLikeACrowd ===
    //     userProfile?.petsProfileId?.doYouLikeACrowd
    //   ) {
    //     countMatch++;
    //     if (!message)
    //       message += `Crowd preference matched.`;
    //   }
    //   if (
    //     petProfile.playSizePreferences ===
    //     userProfile?.petsProfileId?.playSizePreferences
    //   ) {
    //     countMatch++;
    //     if (!message)
    //       message += `Play size preference matched.`;
    //   }
    //   if (
    //     petProfile.locationPreferences ===
    //     userProfile?.petsProfileId?.locationPreferences
    //   ) {
    //     countMatch++;
    //     if (!message)
    //       message += `Location preference matched. `;
    //   }
    //   if (petProfile.address === userProfile?.petsProfileId?.address) {
    //     countMatch++;
    //     if (!message) message += `Address matched.`;
    //   }
    // } else {
    //   message = 'Nearby at you.';
    // }

    const totalMatchItems = 8;
    let countMatch = 0;
    let message = '';

    if (petProfile) {
      const matchFields: { key: keyof TPetProfile; label: string }[] = [
        { key: 'age', label: 'Age matched.' },
        { key: 'size', label: 'Size matched.' },
        { key: 'neuteredSpayed', label: 'Neutered/Spayed matched.' },
        { key: 'howDoYouPlay', label: 'Play style matched.' },
        { key: 'doYouLikeACrowd', label: 'Crowd preference matched.' },
        { key: 'playSizePreferences', label: 'Play size preference matched.' },
        { key: 'locationPreferences', label: 'Location preference matched.' },
        { key: 'address', label: 'Address matched.' },
      ];

      // Count all matches but take the first match message
      for (const { key, label } of matchFields) {
        if (
          petProfile[key] === (userProfile?.petsProfileId as any)[key]
        ) {
          countMatch++;
          if (!message) {
            // Only set the message on the first match
            message = label;
          }
        }
      }
    } else {
      message = 'Nearby at you.';
    }

    const totalPercentage = totalMatchItems
      ? (countMatch / totalMatchItems) * 100
      : 0;

    return { ...user, message, totalPercentage };
  });

  // console.log("==== enriched results === ", enrichedResults)

  return { meta, result: enrichedResults };
};

// const nearFriends = async (
//   userId: string,
//   query: Record<string, unknown>,
// ): Promise<TUserProfile[] | any> => {
//   console.log(userId);
//   const radiusInRadians: number = 10 / 6371;
//   const userProfile = await UserProfile.findOne({ userId: userId });
//   if (!userProfile) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User profile not found');
//   }
//   if (!userProfile?.location) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User location not set yet');
//   }
//   const {
//     location: {
//       coordinates: [userLongitude, userLatitude],
//     },
//   } = userProfile;

//   // Exclude the current user from results
//   query.userId = { $ne: userId };

//   const userQuery = new QueryBuilder(UserProfile.find(), query)
//     .geoWithin('location', [userLongitude, userLatitude], 10) // 10km radius
//     .filter(['name', 'address', 'email']) // Add necessary filterable fields
//     .sort()
//     .paginate()
//     .fields();

//   const meta = await userQuery.countTotal();
//   const result = await userQuery.modelQuery.populate('petsProfileId'); // Add necessary population

//   console.log({ meta, result });

//   console.log({ result });

//   return { meta, result };
// };

// const nearFriends = async (userId: string): Promise<TUserProfile[] | any> => {
//   console.log(userId);
//   const radiusInRadians: number = 10 / 6371; // Radius of 10 km, Earth's radius is ~6371 km
//   const userProfile = await UserProfile.findOne({ userId: userId });
//   if (!userProfile) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User profile not found');
//   }
//   if (!userProfile?.location) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User location not set yet');
//   }

//   const {
//     location: {
//       coordinates: [userLongitude, userLatitude],
//     },
//   } = userProfile;

//   // Use aggregation pipeline to calculate distance
//   const nearbyPets = await UserProfile.aggregate([
//     {
//       $geoNear: {
//         near: { type: 'Point', coordinates: [userLongitude, userLatitude] },
//         distanceField: 'distanceOfFriend', // Field to store calculated distance
//         spherical: true, // Use spherical calculation
//         maxDistance: radiusInRadians * 6371000, // Convert radiusInRadians to meters
//       },
//     },
//     {
//       $match: {
//         userId: { $ne: userId }, // Exclude the current user
//       },
//     },
//     {
//       $lookup: {
//         from: 'petsProfiles', // Replace 'petsProfiles' with the actual collection name
//         localField: 'petsProfileId',
//         foreignField: '_id',
//         as: 'petsProfile',
//       },
//     },
//   ]);

//   return nearbyPets;
// };

// const nearFriends = async (userId: string): Promise<TUserProfile[] | any> => {
//   console.log(userId);
//   const radiusInRadians: number = 10 / 6371;
//   const userProfile = await UserProfile.findOne({ userId: userId });
//   if (!userProfile) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User profile not found');
//   }
//   if (!userProfile?.location) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User location not set yet');
//   }
//   const {
//     location: {
//       coordinates: [userLongitude, userLatitude],
//     },
//   } = userProfile;

//   const nearbyPets = await UserProfile.find({
//     userId: { $ne: userId },
//     location: {
//       $geoWithin: {
//         $centerSphere: [[userLongitude, userLatitude], radiusInRadians], // Coordinates must be [longitude, latitude]
//       },
//     },
//   }).populate('petsProfileId');
//   return nearbyPets;
// };

/**
 * Add new product(s) with sequential product IDs.
 */

export const NearFriendService = {
  nearFriends,
};

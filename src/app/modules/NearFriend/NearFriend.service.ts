import { Aggregate, Document } from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/AppError';
import { TUserProfile } from '../UserProfile/UserProfile.interface';
import { UserProfile } from '../UserProfile/UserProfile.models';

import httpStatus from 'http-status';
import { PetProfile } from '../PetProfile/PetProfile.models';
import { TPetProfile } from '../PetProfile/PetProfile.interface';
import AggregationQueryBuilder from '../../builder/AggregationQueryBuilder';


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

  const userProfile = await UserProfile.findOne({ userId: userId });
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
    .geoNear([userLongitude, userLatitude], 10) // 10-mile radius
    //  .match({ userId: { $ne: userId } }) // Exclude current user
    .filter([])
    // .lookup('PetProfile', '_id', 'petsProfileId', 'petsProfile') // Join pet profiles
    .addFields({ distanceInMiles: { $divide: ['$distanceInMiles', 1609.34] } }) // Convert meters to miles['$distanceOfFriend', 1609.34]
    .sort()
    .paginate()
    .fields();
  const meta = await nearbyFriendsQuery.countTotal();
  let result = await nearbyFriendsQuery.execute();
  result = await UserProfile.populate(result, { path: 'petsProfileId' });

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

    const petProfiles = await petQuery.execute()

    // console.log("=== pet query data ==== ", petProfiles)

    // Step 5: Return the result enriched with PetProfiles and their data
  const enrichedResults = result.map((user) => {
    // Find associated PetProfile for each UserProfile
    const petProfile = petProfiles.find(
      (pet) => pet.userId.toString() === user.userId.toString(),
    );

    

    let message = '';
    if (petProfile) {
      // Set message based on matching filter values
      if (petProfile.age === user?.petsProfileId?.age)
        message += `Age matches: ${petProfile.age} years. `;
      else if (petProfile.size === user?.petsProfileId?.size)
        message += `Size matches: ${petProfile.size}. `;
      else if (petProfile.neuteredSpayed === user?.petsProfileId?.neuteredSpayed)
        message += `Neutered/Spayed matches: ${petProfile.neuteredSpayed}. `;
      else if (petProfile.howDoYouPlay === user?.petsProfileId?.howDoYouPlay)
        message += `Play style matches: ${petProfile.howDoYouPlay}. `;
      else if (petProfile.doYouLikeACrowd === user?.petsProfileId?.doYouLikeACrowd)
        message += `Crowd preference matches: ${petProfile.doYouLikeACrowd}. `;
      else if (petProfile.playSizePreferences === user?.petsProfileId?.playSizePreferences)
        message += `Play size preference matches: ${petProfile.playSizePreferences}. `;
      else if (petProfile.locationPreferences === user?.petsProfileId?.locationPreferences)
        message += `Location preference matches: ${petProfile.locationPreferences}. `;
      else if (petProfile.address === user?.petsProfileId?.address)
        message += `Address matches: ${petProfile.address}. `;
    } else {
      message = 'Address matching...';
    }

    return { ...user, message };
  })

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

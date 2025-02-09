import { Aggregate, FilterQuery, Model, Query } from "mongoose";

class AggregationQueryBuilder<T> {
  public modelQuery: Query<T[], T> | Aggregate<T[]>;
  public query: Record<string, unknown>;
  private isAggregate: boolean = false;
  private model: Model<T>;

  constructor(model: Model<T>, query: Record<string, unknown>) {
    this.model = model;
    this.modelQuery = this.model.find();
    this.query = query;
  }


  querydata(){
    return this.query;
  }

  /**
   * Perform a geo search using `$geoNear`
   */
  geoNear(
    coordinates: [number, number],
    radiusInMiles: number,
    distanceField = 'distanceInMiles',
  ) {
    // Enable aggregation mode
    this.isAggregate = true;

    // Convert miles to meters (MongoDB `$geoNear` uses meters)
    const radiusInMeters = radiusInMiles * 1609.34;

    // Switch to aggregation pipeline
    this.modelQuery = this.model.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates },
          distanceField, // Field to store the calculated distance
          spherical: true, // Spherical calculation
          maxDistance: radiusInMeters, // Max distance in meters
        },
      },
    ]);

    return this;
  }

  filter(filterableFields: string[]) {
    if (this.isAggregate) {
      (this.modelQuery as Aggregate<T[]>)
        .pipeline()
        .push({ $match: this.query });
    } else {
      const queryObj = { ...this.query };
      const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
      excludeFields.forEach((el) => delete queryObj[el]);

      this.modelQuery = (this.modelQuery as Query<T[], T>).find(
        queryObj as FilterQuery<T>,
      );
    }
    return this;
  }

  fields() {
    const fields =
      (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';
    if (this.isAggregate) {
      (this.modelQuery as Aggregate<T[]>)
        .pipeline()
        .push({ $project: { __v: 0 } });
    } else {
      this.modelQuery = (this.modelQuery as Query<T[], T>).select(fields);
    }
    return this;
  }

  match(filters: Record<string, unknown>) {
    if (this.isAggregate) {
      (this.modelQuery as Aggregate<T[]>).pipeline().push({ $match: filters });
    } else {
      this.modelQuery = (this.modelQuery as Query<T[], T>).find(
        filters as FilterQuery<T>,
      );
    }
    return this;
  }

  lookup(from: string, localField: string, foreignField: string, as: string) {
    if (this.isAggregate) {
      (this.modelQuery as Aggregate<T[]>).pipeline().push({
        $lookup: { from, localField, foreignField, as },
      });
    }
    return this;
  }

  addFields(fields: Record<string, unknown>) {
    if (this.isAggregate) {
      (this.modelQuery as Aggregate<T[]>)
        .pipeline()
        .push({ $addFields: fields });
    }
    return this;
  }

//   sort() {
//     if (this.isAggregate) {
//       (this.modelQuery as Aggregate<T[]>)
//         .pipeline()
//         .push({ $sort: { createdAt: -1 } });
//     } else {
//       this.modelQuery = (this.modelQuery as Query<T[], T>).sort('-createdAt');
//     }
//     return this;
//   }

  sort() {
    if (this.isAggregate) return this; // Sorting is done differently in aggregation

    const sort =
      (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = (this.modelQuery as Query<T[], T>).sort(sort as string);
    return this;
  }

  paginate(limit = 10, page = 1) {
    if (this.isAggregate) {
      (this.modelQuery as Aggregate<T[]>)
        .pipeline()
        .push({ $skip: (page - 1) * limit }, { $limit: limit });
    } else {
      this.modelQuery = (this.modelQuery as Query<T[], T>)
        .skip((page - 1) * limit)
        .limit(limit);
    }
    return this;
  }

  async execute() {
    return await this.modelQuery;
  }

  async countTotal() {
    if (this.isAggregate) {
      // Clone the existing pipeline and append $count
      const countPipeline = [
        ...(this.modelQuery as Aggregate<T[]>).pipeline(),
        { $count: 'total' },
      ];

      // Execute aggregation
      const countResult = await this.model.aggregate(countPipeline);

      // Extract count from aggregation result
      const total = countResult.length > 0 ? countResult[0].total : 0;
      const page = Number(this?.query?.page) || 1;
      const limit = Number(this?.query?.limit) || 10;
      const totalPage = Math.ceil(total / limit);

      return { page, limit, total, totalPage };
    } else {
      // For normal find queries
      const totalQueries = (this.modelQuery as Query<T[], T>).getFilter();
      const total = await this.model.countDocuments(totalQueries);
      const page = Number(this?.query?.page) || 1;
      const limit = Number(this?.query?.limit) || 10;
      const totalPage = Math.ceil(total / limit);

      return { page, limit, total, totalPage };
    }
  }
}


export default AggregationQueryBuilder;
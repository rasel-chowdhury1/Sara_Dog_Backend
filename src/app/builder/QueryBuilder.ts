import { FilterQuery, Query, Aggregate, Model } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T> | Aggregate<T[]>;
  public query: Record<string, unknown>;
  private isAggregate: boolean = false;
  private model: Model<T>;

  constructor(model: Model<T>, query: Record<string, unknown>) {
    this.model = model;
    this.modelQuery = this.model.find();
    this.query = {...query};
  }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = (this.modelQuery as Query<T[], T>).find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>,
        ),
      });
    }
    return this;
  }

  filter(filterableFields: string[]) {
    if (this.isAggregate) return this; // Prevent filter on aggregate queries

    const queryObj = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    this.modelQuery = (this.modelQuery as Query<T[], T>).find(
      queryObj as FilterQuery<T>,
    );
    return this;
  }

  sort() {
    if (this.isAggregate) return this; // Sorting is done differently in aggregation

    const sort =
      (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = (this.modelQuery as Query<T[], T>).sort(sort as string);
    return this;
  }

  paginate() {
    if (this.isAggregate) return this; // Pagination must be handled in aggregation pipeline

    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = (this.modelQuery as Query<T[], T>)
      .skip(skip)
      .limit(limit);
    return this;
  }

  fields() {
    if (this.isAggregate) return this; // Projection in aggregation must be done differently

    const fields =
      (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';
    this.modelQuery = (this.modelQuery as Query<T[], T>).select(fields);
    return this;
  }

  /**
   * Perform a geo search using `$geoWithin`
   */
  geoWithin(
    field: string,
    coordinates: [number, number],
    radiusInMiles: number,
  ) {
    if (this.isAggregate) return this; // Not applicable for aggregation

    const radiusInRadians = radiusInMiles / 3959; // Earth's radius in miles
    if (coordinates?.length === 2) {
      this.modelQuery = (this.modelQuery as Query<T[], T>).find({
        [field]: {
          $geoWithin: {
            $centerSphere: [coordinates, radiusInRadians],
          },
        },
      });
    }
    return this;
  }

  async countTotal() {
    if (this.isAggregate) {
      throw new Error('Cannot count total with an aggregate pipeline.');
    }

    const totalQueries = (this.modelQuery as Query<T[], T>).getFilter();
    const total = await this.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;

// import { Aggregate, FilterQuery, Query } from 'mongoose';

// class QueryBuilder<T> {
//   public modelQuery: Query<T[], T> | Aggregate<T[]>;
//   public query: Record<string, unknown>;
//   private isAggregate: boolean = false;

//   constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
//     this.modelQuery = modelQuery;
//     this.query = query;
//   }

//   search(searchableFields: string[]) {
//     const searchTerm = this?.query?.searchTerm;
//     if (searchTerm) {
//       this.modelQuery = this.modelQuery.find({
//         $or: searchableFields.map(
//           (field) =>
//             ({
//               [field]: { $regex: searchTerm, $options: 'i' },
//             }) as FilterQuery<T>,
//         ),
//       });
//     }

//     return this;
//   }

//   filter(productFilterableFields: string[]) {
//     const queryObj = { ...this.query }; // copy

//     // Filtering
//     const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];

//     excludeFields.forEach((el) => delete queryObj[el]);

//     this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);

//     return this;
//   }

//   sort() {
//     const sort =
//       (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
//     this.modelQuery = this.modelQuery.sort(sort as string);

//     return this;
//   }

//   paginate() {
//     const page = Number(this?.query?.page) || 1;
//     const limit = Number(this?.query?.limit) || 10;
//     const skip = (page - 1) * limit;

//     this.modelQuery = this.modelQuery.skip(skip).limit(limit);

//     return this;
//   }

//   fields() {
//     const fields =
//       (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';

//     this.modelQuery = this.modelQuery.select(fields);
//     return this;
//   }

//   geoWithin(field: string, coordinates: [number, number], radiusInKm: number) {
//     const radiusInRadians = radiusInKm / 6371; // Earth's radius in kilometers
//     if (coordinates?.length === 2) {
//       this.modelQuery = this.modelQuery.find({
//         [field]: {
//           $geoWithin: {
//             $centerSphere: [coordinates, radiusInRadians],
//           },
//         },
//       });
//     }
//     return this;
//   }

//   async countTotal() {
//     const totalQueries = this.modelQuery.getFilter();
//     const total = await this.modelQuery.model.countDocuments(totalQueries);
//     const page = Number(this?.query?.page) || 1;
//     const limit = Number(this?.query?.limit) || 10;
//     const totalPage = Math.ceil(total / limit);

//     return {
//       page,
//       limit,
//       total,
//       totalPage,
//     };
//   }
// }

// export default QueryBuilder;

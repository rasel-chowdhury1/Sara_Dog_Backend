import { Model } from 'mongoose';

export type TProduct = {
  image: string;
  title: string;
  description?: string;
  price: Number;
  productLink: string;
};

export type ProductModel = Model<TProduct>;

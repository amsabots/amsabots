export interface SubCategoryResponse {
  id: number;
  name: string;
  category_id: number;
}
export interface PostgressQuerySyntax {
  readonly name: string;
  text: string;
  values: string[] | number[] | any[];
}
export interface Item {
  name: string;
  image_url: string;
  subcategory_id: string;
  desc: string;
  size: number | string;
  price: number;
  id: number;
}
declare global {
  namespace Express {
    interface Request {
      sessionId: string;
      user_id: string;
    }
  }
}

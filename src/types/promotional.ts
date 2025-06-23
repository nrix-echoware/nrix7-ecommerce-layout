
export interface PromotionalImage {
  url: string;
  title: string;
  description: string;
  link: string;
}

export interface PromotionalReel {
  name: string;
  media: string;
  images: PromotionalImage[];
}

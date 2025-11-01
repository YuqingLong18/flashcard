export interface DeckCard {
  id: string;
  front: string;
  back: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeckSummary {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  cardCount?: number;
}

export interface DeckWithCards extends DeckSummary {
  cards: DeckCard[];
}

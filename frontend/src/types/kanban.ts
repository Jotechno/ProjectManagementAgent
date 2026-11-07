export interface Card {
  id: string;
  title: string;
  details: string;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface BoardData {
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  columnOrder: string[];
}

export interface DragLocation {
  droppableId: string;
  index: number;
}

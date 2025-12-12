export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface ChecklistState {
  items: ChecklistItem[];
  isOpen: boolean;
}

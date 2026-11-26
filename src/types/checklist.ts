export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  created_at?: string;
  createdAt?: string | number;
}

export interface ChecklistState {
  items: ChecklistItem[];
  isOpen: boolean;
}

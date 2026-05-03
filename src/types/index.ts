export type GuestGroup = 'Family' | 'Friends' | 'Work' | 'Other';

export type GuestStatus =
  | 'Not Contacted'
  | 'Invited'
  | 'Called'
  | 'Texted'
  | 'Confirmed'
  | 'Declined';

export interface Guest {
  id: string;
  name: string;
  phone: string;
  group: GuestGroup;
  status: GuestStatus;
}

export type ShoppingCategory =
  | 'Decor'
  | 'Attire'
  | 'Venue'
  | 'Catering'
  | 'Misc'
  | 'Gifts';

export interface ShoppingItem {
  id: string;
  itemName: string;
  category: ShoppingCategory;
  isPurchased: boolean;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

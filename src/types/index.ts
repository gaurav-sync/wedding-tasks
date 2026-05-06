export type GuestGroup = 'Family' | 'Friends' | 'Work' | 'Other';

/** Cycle order: Not Contacted → Texted → Called → Declined */
export type GuestStatus = 'Not Contacted' | 'Texted' | 'Called' | 'Declined';

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
  /** Login id of who should complete this task */
  assignedTo: string;
  dueDate: string;
  isCompleted: boolean;
}

/** Shared with API task assignee field */
export const PARTNER_USERNAMES = ['gauravsapkal', 'vaibhavsapkal'] as const;
export type PartnerUsername = (typeof PARTNER_USERNAMES)[number];
export const PARTNER_DISPLAY: Record<PartnerUsername, string> = {
  gauravsapkal: 'Gaurav',
  vaibhavsapkal: 'Vaibhav',
};

export type ExpenseCategory =
  | 'Venue'
  | 'Catering'
  | 'Attire'
  | 'Photography'
  | 'Decor'
  | 'Entertainment'
  | 'Gifts'
  | 'Travel'
  | 'Invitations'
  | 'Misc';

export interface Expense {
  id: string;
  title: string;
  amountInr: number;
  spentOn: string;
  category: ExpenseCategory;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

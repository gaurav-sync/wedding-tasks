export const USER_GAURAV = "gauravsapkal";
export const USER_VAIBHAV = "vaibhavsapkal";

export type UserRole = "owner" | "collaborator";

export const USER_ACCOUNTS: Record<
  string,
  { password: string; role: UserRole; displayName: string }
> = {
  [USER_GAURAV]: {
    password: "Marriage@Plan121",
    role: "owner",
    displayName: "Gaurav",
  },
  [USER_VAIBHAV]: {
    password: "Wedding@Vaibhav121",
    role: "collaborator",
    displayName: "Vaibhav",
  },
};

export const TASK_ASSIGNEES = [USER_GAURAV, USER_VAIBHAV] as const;
export type TaskAssignee = (typeof TASK_ASSIGNEES)[number];

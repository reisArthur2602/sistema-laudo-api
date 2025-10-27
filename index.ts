type Role = "ADMIN" | "MEMBER";

type User = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  patients: [];
  members: Member[];
  invites: Invite[];
  createdAt: Date;
};

type Member = {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  active: boolean;
  createdAt: Date;
};

type Invite = {
  id: string;
  token: string;
  email: string;
  orgId: string;
  expiredAt: Date;
  createdAt: Date;
};

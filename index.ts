type User = {
  id: string;
  name: string;
  email: string;
  memberOf: Member[];
  createdAt: Date;
};

type Organization = {
  id: string;
  name: string;
  members: Member[];
  invites: Invite[];
  patients: Patient[];
  createdAt: Date;
};

type Member = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  active: boolean;
  createdAt: Date;
};

enum Role {
  SUPER_ADMIN,
  ADMIN,
  MEMBER,
}

type Invite = {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

type Patient = {
  id: string;
  organizationId: string;
  name: string;
  patientId?: string;
  studies: Study[];
  createdAt: Date;
};

type Study = {
  id: string;
  patientId: string;
  studyId: string;
  modality: string;
  studyDate: Date;
  series: Series[];
  reports: Report[];
  createdAt: Date;
};

type Series = {
  id: string;
  studyId: string;
  modality: string;
  orthancId: string;
  operatorName?: string;
  instances: Instance[];
  createdAt: Date;
};

type Instance = {
  id: string;
  seriesId: string;
  orthancId: string;
  previewUrl?: string;
  fileUrl?: string;
  createdAt: Date;
};

type Report = {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
};

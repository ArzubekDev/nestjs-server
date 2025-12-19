export type TypeUserInfo = {
  // id: string;
   providerAccountId: string; 
  picture: string;
  name: string;
  email: string;
  access_token?: string | null;
  refresh_token?: string;
  expires_at?: string;
  provider: string;
};

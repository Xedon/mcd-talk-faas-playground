interface User {
  userId?: string;
  nickname: string;
  mail: string;
}
interface Bet {
  betId?: string;
  title: string;
  description: string;
  criteria: Array<{ criteriaTitle: string; criteriaDescription: string }>;
  expirationTime: string;
  creator: User;
  minimumWager: number;
  competitors: Array<User>;
}

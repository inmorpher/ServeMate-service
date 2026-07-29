import { Session } from './entities/session.entity';

export interface IAuthRepository {
  findByJti(jti: string): Promise<Session | null>;
  findActiveByUser(userId: number): Promise<Session[]>;
  save(session: Session): Promise<void>;
}

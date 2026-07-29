export class RefreshToken {
  constructor(
    public readonly token: string,
    public readonly jti: string,
    public readonly expiresAt: Date
  ) {}

  isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }
}

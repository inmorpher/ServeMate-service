export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: number,
    public readonly refreshJti: string,
    public readonly expiresAt: Date,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    private revokedAt: Date | null = null,
    public readonly createdAt: Date = new Date()
  ) {}

  isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isActive(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(): void {
    if (this.isRevoked()) {
      throw new Error('Session is already revoked');
    }
    if (this.isExpired()) {
      throw new Error('Session is already expired');
    }
    this.revokedAt = new Date();
  }

  get revokedAtDate(): Date | null {
    return this.revokedAt;
  }
}

export class AccessToken {
  constructor(
    public readonly token: string,
    public readonly expiresIn: number,
    public readonly expiresAt: Date
  ) {}
}

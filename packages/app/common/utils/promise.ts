export class Blocker {
  private promise: Promise<void>;
  private resolver: VoidFunction = () => {};

  constructor() {
    this.promise = new Promise((resolver) => {
      this.resolver = resolver;
    });
  }

  public async wait() {
    await this.promise;
  }

  public unblock() {
    this.resolver();
  }
}

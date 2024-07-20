export class ForbiddenError extends Error {
  readonly name = "ForbiddenError";

  constructor(public message: string) {
    super(message);
  }
}

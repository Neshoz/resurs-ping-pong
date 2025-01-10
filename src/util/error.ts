export class InvalidCommandError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

// A thin, typed error class so services can throw errors that already know
// their HTTP status code. `app.ts`'s centralized error handler reads
// `err.statusCode`, so throwing `new AppError(...)` anywhere in the request
// lifecycle produces the right response without each controller needing its
// own try/catch translation logic.

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export type ActionError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

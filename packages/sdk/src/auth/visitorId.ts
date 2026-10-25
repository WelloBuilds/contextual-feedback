const VISITOR_ID_KEY = "contextual-feedback:visitor-id";

export function getVisitorId(): string {
  try {
    const existingId = localStorage.getItem(VISITOR_ID_KEY);

    if (existingId) {
      return existingId;
    }

    const newId = crypto.randomUUID();

    localStorage.setItem(VISITOR_ID_KEY, newId);

    return newId;
  } catch {
    return crypto.randomUUID();
  }
}
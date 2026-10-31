export type EventContext = {
  page: {
    id: string | null;
    path: string;
  };
};

export function getEventContext(): EventContext {
  const path = window.location.pathname;
  const pageId = document.documentElement.getAttribute("data-feedback-page")?.trim();

  return {
    page: {
      id: pageId || null,
      path,
    },
  };
}

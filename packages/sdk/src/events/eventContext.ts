export type EventContext = {
  page: {
    id: string | null;
    path: string;
    url: string;
  };
};

export function getEventContext(): EventContext {
  const path = window.location.pathname;
  const pageId = document.documentElement.getAttribute("data-feedback-page")?.trim();

  return {
    page: {
      id: pageId || null,
      path,
      url: `${window.location.origin}${path}`,
    },
  };
}

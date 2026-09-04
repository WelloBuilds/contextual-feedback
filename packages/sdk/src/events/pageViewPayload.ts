export type PageViewPayload = {
  previousUrl: string;
  targetUrl: string;
  type: PageViewTypes | undefined | null;
};

export enum PageViewTypes {
  pushState = "pushState",
  popState = "popState",
  alterUrl = "alterUrl",
}

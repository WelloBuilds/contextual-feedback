export type PageViewPayload = {
  previousPath: string;
  targetPath: string;
  type: PageViewTypes | undefined | null;
};

export enum PageViewTypes {
  pushState = "pushState",
  popState = "popState",
  alterUrl = "alterUrl",
}

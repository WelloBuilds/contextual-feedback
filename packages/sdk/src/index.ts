export interface InitOptions {
    key: string;
  }
  
  function init(options: InitOptions): void {
    console.log("SDK initialized");
  }
  
  export const Feedback = {
    init,
};
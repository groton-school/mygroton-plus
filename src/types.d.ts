interface CSSFile {
  locals: {
    [property: string]: string;
  }
  toString: () => string;
}

declare module '*.css' {
  const locals: CSSFile;
  interface Data {
    locals: CSSFile
  }
  export = locals
}

declare module '*.png' {
  const fileName: string;
  export = fileName;
}

declare module JSX {
  // @ts-ignore workaround for custom JSX pragma
  export type Element = HTMLElement;
}

declare module 'fetch-reject' {
  export default function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

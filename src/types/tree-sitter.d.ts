declare module 'tree-sitter-javascript' {
  export = any;
}

declare module 'tree-sitter-typescript' {
  export = any;
}

declare module 'tree-sitter-python' {
  export = any;
}

declare module 'tree-sitter-java' {
  export = any;
}

declare module 'ignore' {
  function ignore(): any;
  export = ignore;
}

declare module 'fast-glob' {
  export function sync(patterns: string | string[], options?: any): string[];
  export default function fastGlob(patterns: string | string[], options?: any): Promise<string[]>;
}
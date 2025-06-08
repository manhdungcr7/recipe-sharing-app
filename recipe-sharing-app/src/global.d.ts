declare module '*.jsx' {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
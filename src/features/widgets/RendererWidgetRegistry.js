import React, { Suspense } from 'react';

export class ComponentRegistry {
  constructor() {
    this.components = new Map();
  }

  register(id, Component) {
    this.components.set(id, Component);
  }

  render(id, props) {
    const Component = this.components.get(id);
    if (!Component) {
      return <div className="text-red-500 bg-black p-4">Widget not found: {id}</div>;
    }
    return (
      <Suspense fallback={<div className="opacity-0">Loading...</div>}>
        <Component {...props} />
      </Suspense>
    );
  }
}

export const componentRegistry = new ComponentRegistry();

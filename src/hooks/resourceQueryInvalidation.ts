type ResourceQueryInvalidationListener = () => void;

const listeners = new Set<ResourceQueryInvalidationListener>();

export const subscribeResourceQueryInvalidation = (
  listener: ResourceQueryInvalidationListener,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const invalidateResourceQueries = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

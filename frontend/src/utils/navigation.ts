// Full page navigation, kept in its own module so tests can replace it (jsdom cannot navigate)
export const redirectTo = (path: string): void => {
  window.location.assign(path);
};

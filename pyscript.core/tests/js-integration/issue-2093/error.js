const { error } = console;

console.error = (...args) => {
  error(...args);
  document.documentElement.classList.add('errored');
};

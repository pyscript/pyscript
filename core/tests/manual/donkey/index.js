import { donkey } from '../../../dist/core.js';

const runButton = document.querySelector('#run');
const clearButton = document.querySelector('#clear');
const killButton = document.querySelector('#kill');

const {
  execute,  // exec(expression)
  evaluate, // eval(expression)
  process,  // process(code)
  clear,
  kill,
} = await donkey({ terminal: '#container' });

clearButton.onclick = async () => {
  killButton.disabled = true;
  clearButton.disabled = true;
  await clear();
  runButton.disabled = false;
};
killButton.onclick = () => {
  killButton.disabled = true;
  clearButton.disabled = true;
  runButton.disabled = true;
  kill();
};

runButton.disabled = false;
runButton.onclick = async () => {
  killButton.disabled = false;
  clearButton.disabled = false;
  runButton.disabled = true;
  // multiline code
  await execute(`
    a = 1 + 2
    print(f'1 + 2 = {a}')
  `);
  // single expression evaluation
  const name = await evaluate('input("what is your name? ")');
  alert(`Hello ${name}`);
  killButton.disabled = true;
  runButton.disabled = false;
};

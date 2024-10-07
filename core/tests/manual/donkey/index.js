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

clearButton.onclick = clear;
killButton.onclick = kill;

runButton.disabled = false;
runButton.onclick = async () => {
  killButton.disabled = false;
  clearButton.disabled = true;
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
  clearButton.disabled = false;
  runButton.disabled = false;
};

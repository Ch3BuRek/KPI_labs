import { generator } from "./generator.js";
import { run } from "./iterator.js";

const gen = generator();
let sum = 0;

run(gen, 5, (value, i) => {
  sum += value;
  console.log(`#${i} → ${value}  (avg: ${(sum / i).toFixed(2)})`);
}).then(({ iterations }) => {
  console.log(`Stopped after ${iterations} iterations`);
});
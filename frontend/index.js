import { Queue } from "../backend/queue.js";

const q = new Queue();
q.enqueue("task1", 1)
    .enqueue("task2", 3)
    .enqueue("task3", 2)
    .enqueue("task4", 3);

console.log(q.dequeue());
console.log(q.peek("highest"));
q.enqueue("task4", 3);
console.log(q.dequeue("newest"));

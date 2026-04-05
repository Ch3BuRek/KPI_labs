class Queue {
#items = [];

enqueue(item, priority) {
    this.#items.push({ item, priority });
}

dequeue() {
    if (this.#items.length === 0) return null;
    return this.#items.pop();
}

peek(mode = "highest") {
    if (this.#items.length === 0) return null;

    if (mode === "highest") {
        return this.#items.reduce((max, n) =>
        n.priority > max.priority ? n : max
        );
    }

    if (mode === "lowest") {
        return this.#items.reduce((min, n) =>
        n.priority < min.priority ? n : min
        );
    }
}

}

const q = new Queue();
q.enqueue("Task A", 2); 
q.enqueue("Task B", 5);
q.enqueue("Task C", 1);
q.dequeue();
console.log(q.peek("highest"));
console.log(q.peek("lowest"));


class Queue {
#items = [];

#parent(i) { return Math.floor((i - 1) / 2); }
#left(i) { return 2 * i + 1; }
#right(i) { return 2 * i + 2; }

#swap(i, j) {
    [this.#items[i], this.#items[j]] = [this.#items[j], this.#items[i]];
}

enqueue(item, priority) {
    this.#items.push({ item, priority });
    this.#raise(this.#items.length - 1);
}

dequeue() {
    if (this.#items.length === 0) return null;

    const root = this.#items[0];
    const last = this.#items.pop();

    if (this.#items.length > 0) {
        this.#items[0] = last;
        this.#lower(0);
    }

    return root;
}

#raise(i) {
    while (i > 0) {
        const p = this.#parent(i);

        if (this.#items[p].priority >= this.#items[i].priority) break;

        this.#swap(i, p);
        i = p;
    }
}

#lower(i) {
    const n = this.#items.length;

    while (true) {
        let largest = i;
        const l = this.#left(i);
        const r = this.#right(i);

        if (l < n && this.#items[l].priority > this.#items[largest].priority)
        largest = l;

        if (r < n && this.#items[r].priority > this.#items[largest].priority)
        largest = r;

        if (largest === i) break;

        this.#swap(i, largest);
        i = largest;
    }
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


class Queue {
#items = [];
#counter = 0;

#parent(i) { return Math.floor((i - 1) / 2); }
#left(i) { return 2 * i + 1; }
#right(i) { return 2 * i + 2; }

#swap(i, j) {
    [this.#items[i], this.#items[j]] = [this.#items[j], this.#items[i]];
}

enqueue(item, priority) {
    if (typeof priority !== "number") throw new TypeError("priority error!!!!!!!!!");
    this.#items.push({item, priority, order: this.#counter++});
    this.#raise(this.#items.length - 1);
}

dequeue(mode = "highest") {
    if (this.isEmpty()) return null;
    const n = this.#extractItem(mode);
    return n ? { item: n.item, priority: n.priority } : null;
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

#findItem(mode) {
    switch (mode) {
        case "highest": return this.#items[0];
        case "lowest":  return this.#items.reduce((min, n) => n.priority < min.priority ? n : min);
        case "oldest":  return this.#items.reduce((old, n) => n.order < old.order ? n : old);
        case "newest":  return this.#items.reduce((nEw,  n) => n.order > nEw.order  ? n : nEw);
        default: throw new Error(`Use: highest/lowest/oldest/newest`);
    }
}

peek(mode = "highest") {
    if (this.isEmpty()) return null;
    
    const n = this.#findItem(mode);
    return n ? { item: n.item, priority: n.priority } : null;
}

#extractItem(mode) {
    const target = this.#findItem(mode);
    const id = this.#items.indexOf(target);

    const last = this.#items.length - 1;
    this.#swap(id, last);
    this.#items.pop();

    if (id < this.#items.length) {
        this.#raise(id);
        this.#lower(id);
    }

    return target;
}

}
class EventEmitter {
  #listeners = new Map();
  #name;

  constructor(name = 'Emitter') {
    this.#name = name;
  }

  on(event, fn) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }

    this.#listeners.get(event).add(fn);

    return () => this.off(event, fn);
  }

  once(event, fn) {
    const wrapper = (data) => {
      fn(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off(event, fn) {
    this.#listeners.get(event)?.delete(fn);
  }

  emit(event, data) {
    const payload = {
      event,
      data,
      source: this.#name,
      timestamp: new Date().toISOString()
    };

    this.#listeners.get(event)?.forEach(fn => fn(payload));
    this.#listeners.get('*')?.forEach(fn => fn(payload));
  }
}

class Observable {
  #subscribeFn;

  constructor(subscribeFn) {
    this.#subscribeFn = subscribeFn;
  }

  static fromEvent(emitter, event) {
    return new Observable((observer) => {
      const unsub = emitter.on(event, (payload) => observer.next(payload));
      return unsub;
    });
  }

  subscribe(onNext, onComplete) {
    const observer = {
      next: onNext,
      complete: onComplete || (() => {}),
    };

    const cleanup = this.#subscribeFn(observer);

    return {
      unsubscribe: () => {
        if (typeof cleanup === "function") cleanup();
        observer.complete();
      }
    };
  }

  map(fn) {
    return new Observable((observer) => {
      const sub = this.subscribe(
        (value) => observer.next(fn(value)),
        (err)   => observer.error(err),
      );
      
      return () => sub.unsubscribe();
    });
  }

  take(count) {
    return new Observable((observer) => {
      let seen = 0;
      const sub = this.subscribe((value) => {
        observer.next(value);
        if (++seen >= count) sub.unsubscribe();
      });
      
      return () => sub.unsubscribe();
    });
  }
}

const emitter = new EventEmitter();

const obs = Observable
  .fromEvent(emitter, 'test')
  .take(2);

obs.subscribe(v => console.log("take:", v.data));

emitter.emit('test', 1);
emitter.emit('test', 2);
emitter.emit('test', 3);
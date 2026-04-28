class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
    return () => {
      this.listeners[event] =
        this.listeners[event].filter(f => f !== fn);
    };
  }

  once(event, fn) {
    const wrapper = (data) => {
      fn(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off(event, fn) {
    this.listeners[event] =
      (this.listeners[event] || []).filter(f => f !== fn);
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  }
}

class Observable {
  constructor(subscribeFn) {
    this.subscribeFn = subscribeFn;
  }

  subscribe(onNext) {
    const cleanup = this.subscribeFn({
      next: onNext
    });

    return {
      unsubscribe: () => {
        if (cleanup) cleanup();
      }
    };
  }
}

const emitter = new EventEmitter();

const unsub = emitter.on('test', (d) => {
  console.log("got:", d);
});

emitter.emit('test', 1);
unsub();
emitter.emit('test', 2);
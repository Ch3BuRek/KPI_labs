export class EventEmitter {
  #listeners = new Map();
  #name;

  constructor(name = 'Emitter') {
    this.#name = name;
  }

//----------------------------------------------------------------------
  on(event, listener) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }

    this.#listeners.get(event).add(listener);

    return () => this.off(event, listener);
  }

  off(event, listener) {
    this.#listeners.get(event)?.delete(listener);
  }

  once(event, listener) {
    const wrapper = (data) => {
      listener(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  emit(event, data) {
    const payload = {
      event,
      data,
      source: this.#name,
      timestamp: new Date().toISOString()
    };

    this.#listeners.get(event)?.forEach(listener => listener(payload));
    this.#listeners.get('*')?.forEach(listener => listener(payload));
  }

  clear(event) {
    if (event) this.#listeners.delete(event);
    else this.#listeners.clear();
  }

  listenerCount(event) {
    return this.#listeners.get(event)?.size ?? 0;
  }
}

export class Observable {
  #subscribeliste;

  constructor(subscribeliste) {
    this.#subscribeliste = subscribeliste;
  }

//----------------------------------------------------------------------
  static fromEvent(emitter, event) {
    return new Observable((observer) => {
      const unsub = emitter.on(event, (payload) => observer.next(payload));
      return unsub;
    });
  }

  subscribe(onNext, onComplete) {
    const observer = {
      next:     onNext     || (() => {}),
      error:    onError    || ((err) => console.error("observable error:", err)),
      complete: onComplete || (() => {}),
    };

    const cleanup = this.#subscribeliste(observer);

    return {
      unsubscribe: () => {
        if (typeof cleanup === "function") cleanup();
        observer.complete();
      }
    };
  }

//----------------------------------------------------------------------
  map(listener) {
    return new Observable((observer) => {
      const sub = this.subscribe(
        (value) => observer.next(listener(value)),
        (err)   => observer.error(err),
      );

      return () => sub.unsubscribe();
    });
  }

  filter(predicate) {
    return new Observable((observer) => {
      const sub = this.subscribe(
        (value) => { if (predicate(value)) observer.next(value); },
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

  static merge(...observables) {
    return new Observable((observer) => {
      const subs = observables.map(obs => obs.subscribe(
        (value) => observer.next(value),
        (err) => observer.error(err),
      ));

      return () => subs.forEach(s => s.unsubscribe());
    });
  }
}
export function run(iterator, timeout, onValue) {
  const end = Date.now() + timeout * 1000;
  let i = 0;

  return new Promise((resolve) => {
    function tick() {
      if (Date.now() >= end) {
        resolve({ iterations: i, reason: "timeout" });
        return;
      }
      const { value, done } = iterator.next();
      if (done) { resolve({ iterations: i, reason: "done" }); return; }
      onValue(value, ++i);
      setTimeout(tick, 0);
    }
    setTimeout(tick, 0);
  });
}
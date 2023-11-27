let broadcastWorkers = new Map();

function startBroadcastWorker(workerData) {
  if (broadcastWorkers.size < 5) {
    var worker = new Worker(path.join(path.dirname(process.execPath), '/lib/browserWorker.js'), { workerData: workerData });

    worker.on('error', (err) => { throw err; });

    worker.on('exit', () => {
      broadcastWorkers.delete(worker);
      console.log("Worker has exited.");
    });

    broadcastWorkers.set(worker, true);

    const maxRuntime = 4 * 60 * 60 * 1000; // 4 hours
    setTimeout(() => {
      worker.terminate();
      console.log("Worker terminated after 4 hours.");
    }, maxRuntime);
  } else {
    console.log("Maximum number of workers reached. Cannot start a new worker.");
  }
}

// Usage example:
const workerData = {
  cmd: cmd,
  thread: t,
  counter: c,
  threadIndex: threadIndex,
  ipfsBinaryPrefix: ipfsBinaryPrefix
};

startBroadcastWorker(workerData);
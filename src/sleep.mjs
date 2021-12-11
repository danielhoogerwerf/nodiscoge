const timeout = (timeoutTime) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeoutTime);
  });

const sleepTimer = async (arg) => await timeout(arg);

export { sleepTimer };

// await new Promise(resolve => setTimeout(resolve, timeoutTime));

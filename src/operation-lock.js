export function createOperationLock() {
  let activeOperation = "";

  return {
    start(operation) {
      if (activeOperation) return false;
      activeOperation = operation;
      return true;
    },
    finish(operation) {
      if (activeOperation === operation) activeOperation = "";
    },
    current() {
      return activeOperation;
    },
  };
}

import closestMatch from './closestMatch';

interface delegateObject {
  off: Function
}

interface eventObject {
  [key: string]: Map<HTMLElement, Map<string, Map<number, Function>>>;
}

interface useCapture {
  passive: true;
}

const listenerMap: Map<HTMLElement, Map<string, Function>> = new Map();
const eventObject:eventObject = {};
let i: number = 0;

function getEventTypeCaptureStr (type, useCapture): string {
  return `${type}${JSON.stringify(useCapture)}`;
}

function getListenerFn (element: HTMLElement, evtTypeCapture: string): EventListener {
  return (evt) => {
    eventObject[evtTypeCapture].get(element).forEach((fns, selector) => {
      const delegateTarget = closestMatch(evt.target, selector);

      if (delegateTarget) {
        fns.forEach(fn => fn.call(delegateTarget, evt));
      }
    });
  };
}

function addListenerToMap (element, type, selector, callback, useCapture): number {
  const evtTypeCapture: string = getEventTypeCaptureStr(type, useCapture);
  let addNewEventListener: boolean = false;

  // Create Event/Capture Map if it doesn't exist 
  if (!eventObject[evtTypeCapture]) {
    eventObject[evtTypeCapture] = new Map();
  }
  
  // Create Element Map if it doesn't exist
  if (!eventObject[evtTypeCapture].has(element)) {
    eventObject[evtTypeCapture].set(element, new Map());
    addNewEventListener = true;
  }

  // Create function map if the selector doesn't yet exist underneath the element map
  if (!eventObject[evtTypeCapture].get(element).has(selector)) {
    eventObject[evtTypeCapture].get(element).set(selector, new Map());
  }

  // Set in Map
  eventObject[evtTypeCapture].get(element).get(selector).set(i, callback);
  i++;

  // Create a new event listener if neccessary
  if (addNewEventListener) {
    const listenerFn = getListenerFn(element, evtTypeCapture);

    if (!listenerMap.has(element)) listenerMap.set(element, new Map());
    if (!listenerMap.get(element).has(evtTypeCapture)) listenerMap.get(element).set(evtTypeCapture, listenerFn);
    element.addEventListener(type, listenerFn, useCapture);
  }

  return i;
}

function removeListenerFromMap (element, type, selector, useCapture, callbackIndex): void {
  const evtTypeCapture: string = getEventTypeCaptureStr(type, useCapture);
  let removeTheEventListener: boolean = false;

  // Remove function from callback map
  eventObject[evtTypeCapture].get(element).get(selector).delete(callbackIndex);

  // If no more selectors under that selector, delete the map
  if (!eventObject[evtTypeCapture].get(element).get(selector).size) {
    eventObject[evtTypeCapture].get(element).delete(selector);
  }

  // If no more selectors under that event, delete the map
  if (!eventObject[evtTypeCapture].get(element).size) {
    eventObject[evtTypeCapture].delete(element);
    removeTheEventListener = true;
  }

  // Remove event listener if neccessary
  if (removeTheEventListener) {
    element.removeEventListener(type, listenerMap.get(element).get(evtTypeCapture), useCapture);
    listenerMap.get(element).delete(evtTypeCapture);
    if (!listenerMap.get(element).size) listenerMap.delete(element);
  }
}

export default function delegate(element: HTMLElement, type: string, selector: string, callback: EventListener, useCapture: boolean|useCapture = false): delegateObject {
  const callbackIndex: number = addListenerToMap(element, type, selector, callback, useCapture);

  return {
    off() {
      removeListenerFromMap(element, type, selector, useCapture, callbackIndex);
    }
  };
};

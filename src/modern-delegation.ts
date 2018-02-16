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
  if (addNewEventListener) element.addEventListener(type, getListenerFn(element, evtTypeCapture), useCapture);

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
  if (removeTheEventListener) element.removeEventListener(type, getListenerFn(element, evtTypeCapture), useCapture);
}

export default function delegate(element: HTMLElement, type: string, selector: string, callback: EventListener, useCapture: boolean|useCapture = false): delegateObject {
  const callbackIndex: number = addListenerToMap(element, type, selector, callback, useCapture);

  return {
    off() {
      removeListenerFromMap(element, type, selector, useCapture, callbackIndex);
    }
  };
};

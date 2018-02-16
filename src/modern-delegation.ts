interface eventObject {
  [key: string]: Map<HTMLElement, Map<string, Function[]>>;
}

interface useCapture {
  passive: true;
}

const eventObject:eventObject = {};




function getListenerFn (element: HTMLElement, evtTypeCapture: string): EventListener {
  
}





function addListenerToMap (element: HTMLElement, type: string, selector: string, callback: EventListener, useCapture: boolean|useCapture): number {
  const evtTypeCapture: string = `${type}${JSON.stringify(useCapture)}`;
  const listenerFn: Function = callback.bind(element);
  let addNewEventListener: boolean = false;

  // Create Event/Capture Map if it doesn't exist 
  if (!eventObject[evtTypeCapture]) {
    eventObject[evtTypeCapture] = new Map();
    addNewEventListener = true;
  }
  
  // Create Element Map if it doesn't exist
  if (!eventObject[evtTypeCapture].has(element)) {
    eventObject[evtTypeCapture].set(element, new Map());
    addNewEventListener = true;
  }

  // Create function array if the selector doesn't yet exist underneath the element map
  if (!eventObject[evtTypeCapture].get(element).has(selector)) {
    eventObject[evtTypeCapture].get(element).set(selector, []);
    addNewEventListener = true;
  }

  // Create a new event listener if neccessary
  if (addNewEventListener) element.addEventListener(type, getListenerFn(element, evtTypeCapture), useCapture);

  // Set in Map
  return eventObject[evtTypeCapture].get(element).get(selector).push(listenerFn);
}





function delegate(element: HTMLElement, type: string, selector: string, callback: EventListener, useCapture: boolean|useCapture = false) {

  /*
  var listenerFn = callback.bind(element);

  element.addEventListener(type, listenerFn, useCapture);

  return {
    off() {
      element.removeEventListener(type, listenerFn, useCapture);
    }
  };
  */
}

export default delegate;

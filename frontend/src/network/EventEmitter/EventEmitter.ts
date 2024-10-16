export const EventEmitter = <State>(initialState: State) => {
  interface StateHandler {
    state: State;
    date: Date;
  }
  type Subscriber = (state: State) => void;
  type Callback<EventData> = (state: State, event: EventData) => State;

  const stateHandler: StateHandler = {
    state: initialState,
    date: new Date(),
  };
  const subscribers: Subscriber[] = [];

  const subscribe = (subscriber: Subscriber) => subscribers.push(subscriber);
  const eventEmitter =
    <EventData>(callback: Callback<EventData>) =>
    (event: EventData) => {
      stateHandler.state = callback(stateHandler.state, event);
      stateHandler.date = new Date();
      subscribers.map((subscriber) => subscriber(stateHandler.state));
      return stateHandler.state;
    };

  const getState = () => stateHandler.state;

  return { eventEmitter, subscribe, getState };
};

export const Stream = <Event>() => {
  type Subscriber = (event: Event) => void;
  const subscribers: (Subscriber | undefined)[] = [];

  const on = (subscriber: Subscriber) => {
    subscribers.push(subscriber);
    return subscribers.length - 1;
  };
  const emit = (event: Event) =>
    subscribers.map((subscriber) => requestAnimationFrame(() => subscriber && subscriber(event)));

  const unsubscribe = (position: number) => {
    subscribers[position] = undefined;
  };
  return { on, emit, unsubscribe };
};

export interface Log {
  type: string;
  message: any;
  date: Date;
}

const logs: Record<string, Log[]> = {};

export const _log = (type: string, message: any) => {
  if (!logs[type]) logs[type] = [];

  logs[type].unshift({ type, message, date: new Date() });

  logs[type] = logs[type].slice(0, 30);

  dispatch(type, logs[type]);
};

type Callback = (logs: Log[]) => void;
const callbacks: Record<string, Callback[]> = {};

export const onLogs = (type: string, callback: Callback) => {
  if (!callbacks[type]) callbacks[type] = [];

  callbacks[type].push(callback);
};

const dispatch = (type: string, logs: Log[]) => {
  callbacks[type] && callbacks[type].map((callback) => requestAnimationFrame(() => callback(logs)));
};

export const Stream = <Event,>() => {
  type Subscriber = (event: Event) => void;
  const subscribers: Subscriber[] = [];

  const on = (subscriber: Subscriber) => subscribers.push(subscriber);
  const emit = (event: Event) =>
    requestAnimationFrame(() => subscribers.map((subscriber) => subscriber(event)));
  return { on, emit };
};

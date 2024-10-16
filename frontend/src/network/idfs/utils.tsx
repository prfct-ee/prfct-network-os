export const cloneObject = (object: any) => (object ? JSON.parse(JSON.stringify(object)) : object);

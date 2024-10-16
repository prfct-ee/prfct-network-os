export const setToLocalStorage = (key: string, data: any) => {
  window.localStorage.setItem(key, JSON.stringify(data));
};

export const getFromLocalStorage = (key: string) => {
  const data = window.localStorage.getItem(key);

  try {
    return data ? JSON.parse(data) : undefined;
  } catch (e) {
    console.log("Local storage data JSON parsing error");
    window.localStorage.removeItem(key);
    return undefined;
  }
};

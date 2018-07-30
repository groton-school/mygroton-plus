// Promise-based wrappers for chrome storage API

const storage = {
  get: function get(property, doSync = true) {
    return new Promise(resolve => {
      const handleGet = value => resolve(value[property]);
      if (doSync) {
        chrome.storage.sync.get(property, handleGet);
      } else {
        chrome.storage.local.set(property, handleGet);
      }
    });
  },

  set: function set(property, doSync = true) {
    return new Promise(resolve => {
      if (doSync) {
        chrome.storage.sync.set(property, resolve);
      } else {
        chrome.storage.local.set(property, resolve);
      }
    });
  },
};

export default storage;

function warnType(id) {
  if (typeof id !== 'string') {
    console.warn(`ID should be a string, not a ${typeof id}`); // eslint-disable-line no-console
  }
}

export function reduceArray(data, id, reducer) {
  return data.map(item => {
    if (item.id === id) {
      return reducer(item);
    }
    return item;
  });
}
// [audit-todo] can this not be exported?
export function generateID() {
  return String(Math.floor(Math.random() * 1000000));
}

/**
 * @returns Added item's ID
 */
export async function addItem(key, newItem) {
  const array = await storage.get(key);
  newItem.id = generateID();
  array.push(newItem);
  storage.set({ [key]: array });
  return newItem.id;
}

export async function deleteItem(key, id) {
  const array = await storage.get(key);
  warnType(id);
  const newArray = array.filter(assignment => (
    assignment.id !== id
  ));
  storage.set({ [key]: newArray });
}

export async function changeItem(key, id, reducer) {
  const array = await storage.get(key);
  warnType(id);
  const newArray = reduceArray(array, id, reducer);
  storage.set({ [key]: newArray });
}

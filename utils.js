export const ID = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase()
}

export const listify = (obj) => {
  try{
    return Object.keys(obj).map(k => obj[k])
  }
  catch(err) {
    return []
  }
}

export const statusText = {
  0: 'Not Started',
  1: 'Running',
  2: 'Stopped',
  3: 'Finished'
}
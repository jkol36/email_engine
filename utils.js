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

export const eliminateDuplicates = (array) => {
  let obj = {}
  let out = []
  for(let i=0; i<array.length; i++) {
    obj[array[i]] = 0
  }
  for (let x in obj) {
    out.push(x)
  }
  return out
}

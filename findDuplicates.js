require('babel-register');
require('./config.js');
let hashtagRef = require('./config').hashtagRef
let influencerRef = require('./config').influencerRef
let hashtagId = 1
let influencerId = 1
const eliminateDuplicates = (array) => {
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
// hashtagRef.child(hashtagId).once('value', snap => {
//   let rootObj = snap.val()
//   let initialEmails  = Object.keys(rootObj.emails).map(email => rootObj.emails[email])
//   let newEmailList = eliminateDuplicates(Object.keys(rootObj.emails).map(email => rootObj.emails[email].email))
//   let finalEmailCount = 0
//   let totalEmails = initialEmails.filter(initialEmail => initialEmail.email != undefined)
//   console.log(totalEmails.length)
//   hashtagRef.child(hashtagId).child('uniqueEmails').set({})
//   newEmailList.forEach(email => {
//     let emailObj = initialEmails.filter(initialEmail => initialEmail.email === email)[0]
//     hashtagRef.child(hashtagId).child('uniqueEmails').push(emailObj, () => {
//       finalEmailCount +=1
//       console.log('finalEmailListLength', finalEmailCount)
//     })
//   })

// })
influencerRef.child(influencerId).once('value', snap => {
  let rootObj = snap.val()
  let initialEmails = Object.keys(rootObj.emails).map(k => rootObj.emails[k])
  let newEmailList = eliminateDuplicates(initialEmails.map(obj => obj.email))
  influencerRef.child(influencerId).child('uniqueEmails').set({})
  let finalEmailCount = 0
  newEmailList.forEach(email => {
    let emailObj = initialEmails.filter(initialEmail => initialEmail.email === email)[0]
    influencerRef.child(influencerId).child('uniqueEmails').push(emailObj, () => {
      finalEmailCount += 1
      console.log('email count', finalEmailCount)
    })
  })
})
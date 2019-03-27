import { expect } from 'chai'
import { getUserProfile, getFollowers } from '../helpers'
import { parseProfile } from '../parser'
import { ID } from '../utils'


describe('instagram bot', () => {
  let igProfile
  let initialFollowers
  let query = {
    type: 'Influencer', 
    id: ID(),
    batchId: ID(),
    payload: 'prog_shahad'
  }
  it.only('should get user profile', done => {
    getUserProfile(query.payload)
    .then(res => {
      expect(res).to.not.be.undefined
      return parseProfile(res)
    })
    .then(parsed => {
      let {id, followedBy, follows, name, username} = parsed
      expect(id, followedBy, follows, name, username).to.not.be.undefined
      return getFollowers(query, parsed.id, null)
            .then(followers => {
              expect(followers).to.not.be.undefined
              initialFollowers = followers
              console.log(initialFollowers)
              done()
            })
            .catch(err => {
              done()
            })
    })
    .then(console.log)

  })
  // it('should get followers with placeholder', done => {
  //   expect(initialFollowers).to.not.be.undefined
  //   expect(initialFollowers).to.be.an.array
  //   expect(initialFollowers[0]).to.be.a.string
  //   getFollowers(query, igProfile.id, 'AQAN2WdxV-PfVpYueaHMI_JsHF2bPkeXrqdUYdHxFIi5IdWXlaWOBs_c0JHSltoBJq-cS34b6O73Odvs6mhsw6Hl_Xfx2GTBIBR2P5QKizVDCg')
  //   .then(followers => {
  //     console.log(followers)
  //     expect(followers).to.not.be.undefined
  //     expect(followers[0]).to.not.be.undefined
  //     expect(followers[0]).to.not.eq(initialFollowers[0])
  //     done()
  //   })
  // })
  
})
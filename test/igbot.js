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
    payload: 'xtinaandrews'
  }
  it('should get user profile', done => {
    getUserProfile(query.payload)
    .then(res => {
      igProfile = res
      expect(res).to.not.be.undefined
      done()
    })
  })
  it('should parse profile', done => {
    expect(igProfile).to.not.be.undefined
    parseProfile(igProfile)
    .then(profile => {
      expect(profile).to.not.be.undefined
      igProfile = profile
      done()
    })
  })
  it('should get followers without placeholder', done => {
    getFollowers(query, igProfile.id, null)
    .then(followers => {
      expect(followers).to.not.be.undefined
      initialFollowers = followers
      done()
    })
    .catch(err => {
      done()
    })
  })
  it('should get followers with placeholder', done => {
    expect(initialFollowers).to.not.be.undefined
    expect(initialFollowers).to.be.an.array
    expect(initialFollowers[0]).to.be.a.string
    getFollowers(query, igProfile.id, 'AQAN2WdxV-PfVpYueaHMI_JsHF2bPkeXrqdUYdHxFIi5IdWXlaWOBs_c0JHSltoBJq-cS34b6O73Odvs6mhsw6Hl_Xfx2GTBIBR2P5QKizVDCg')
    .then(followers => {
      console.log(followers)
      expect(followers).to.not.be.undefined
      expect(followers[0]).to.not.be.undefined
      expect(followers[0]).to.not.eq(initialFollowers[0])
      done()
    })
  })
  
})
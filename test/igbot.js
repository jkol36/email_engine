import { expect } from 'chai'
import { getUserProfile, getFollowersFromInstagram } from '../helpers'
import { parseProfile } from '../parser'
import {placeholderUpdated, emailFound, createQueryResult } from '../actionCreators'
import { ID } from '../utils'
import { queryResultRef } from '../config'
import fetch from 'node-fetch'
import  { store } from '../store'


const agent = require('superagent-bluebird-promise');


describe('instagram bot', () => {
  let igProfile 
  let initialFollowers
  let query = {
    type: 'Influencer', 
    id: ID(),
    batchId: ID(),
    payload:'jkol36'
  }
  const createNewFollower = (instagramUsername, 
    follows, 
    queryId, 
    pageNumber) => {
    return {
      instagramUsername,
      follows,
      queryId,
      pageNumber,
      type: 'Follower'
    }
  }

  // it.only('should login to instagram', done => {
  //   const login = (username, password) => {
  //     return fetch("https://www.instagram.com/accounts/login/ajax/", 
  //       {
  //         "credentials":"include","headers":{},
  //         "referrer":`https://www.instagram.com/accounts/login/?source=auth_switcher","referrerPolicy":"no-referrer-when-downgrade","body":"username=${username}&password=${password}&queryParams=%7B%22source%22%3A%22auth_switcher%22%7D`,
  //         "method":"POST",
  //         "mode":"cors"
  //     });
  //   }
  //   login('jkol36', 'J0nnyb0y123')
  //   .then(console.log)
  // })
  // it('should update a query', done => {
  //   let initialQuery = {
  //     type: 'Influencer', 
  //     id: ID(),
  //     batchId: ID(),
  //     payload: 'nutiva'
  //   }
    // let updateQuery = require('../actionCreators').updateQuery
    //store.dispatch(updateQuery(initialQuery.id, initialQuery, updates))
    it.only('should get initial state', done => {
      let initialState = store.getState()
      console.log('initialState', initialState)
      // let followers = ["mupanb879149","yi290302","1naushie","ourstorybytamra","geek_in_chief","jazzinsideband","alexshufran","gerson.sandoval02","thor.dccxviii","bunny._chaudhary","prog_shahad"]
      // expect(followers).to.not.be.undefined
      // followers.forEach(follower => {
      //   store.dispatch({type:'QUERY_RESULT_ADDED', 
      //     queryResult:{
      //       type:'follower', 
      //       instagramUsername:follower, 
      //       queryId:'123',
      //       pageNumber: 1, 
      //       follows:'jkol36'}, 
      //       queryId: '123'
      //     })
        
      // })
      store.dispatch(emailFound('jonathankolman@gmail.com'))
      //expect(store.getState().queryResults.length).to.equal(11)
      expect(store.getState().emails.length).to.eq(1)
      console.log(store.getState())
      done()
    })
  })

  
  // it.only('should get instagram profile', done => {
  //   getUserProfile('nutiva')
  //   .then(res => {
  //     console.log(res)
  //     done()
  //   })
  // })
  // it('should get user profile', done => {
  //   getUserProfile(query.payload)
  //   .then(res => {
  //     console.log(res)
  //     done()
  //   })
  //   .catch(err => {
  //     console.log(err)
  //     done()
  //   })
  // })
  //to do query all follower urls and parse for emails
  // const startFollowerChain = (query, userId, count, placeholder) => {
  //   getFollowersFromInstagram(query, userId, count, placeholder)
  //   .then(({followers, end_cursor}) => {
  //     console.log(followers.map(follower => follower.username))
  //     if(!end_cursor) {
  //       return process.exit()
  //     }
  //     return store.dispatch(placeholderUpdated(query, end_cursor)).then(() => {
  //       return Promsie.all(Promsise.map(followers, follower => {
  //         return createQueryResult(query, createNewFollower(follower, query.payload,query.id, end_cursor))
  //       }))
  //     })
  //     .then(() => {
  //       return startFollowerChain(query, userId, count, store.getState().placeholders[query.id])
  //     })
  // })
  // it('should get initial followers for a user from instagram', done => {
  //   let userId = '1189159040' //my user id
  //   let count = 12
  //   let placeholder = null
  //   getFollowersFromInstagram(query, userId, count, placeholder)
  //   .then(({followers, end_cursor}) => {
  //     console.log('followers', followers)
  //     store.dispatch(placeholderUpdated(query, end_cursor))
  //     .then(() => {
  //       console.log('done', store.getState())
  //     })
  //     .then(() => {

  //       let promises = Promise.map(followers, follower => {
  //         store.dispatch(createQueryResult(query, createNewFollower(follower, query.payload, query.id, end_cursor)))
  //       })
  //       return Promise.all(promises)
  //     })
  //     .then(() => done())
  //     })
  //   })
  // it.only('should get initial followers for a user from firebase', done => {
  //   queryResultRef.once('value').then(snap => {
  //     let rootObj = snap.val()
  //     let queryIds = Object.keys(rootObj)
  //     queryIds.map(id => {
  //       let resultsForQueryId = rootObj[id]
  //       let resultIds = Object.keys(resultsForQueryId)
  //       let results = resultIds.map(resultId => {
  //         let resultObjForQueryId = resultsForQueryId[resultId]
  //         return resultObjForQueryId
  //       })
  //       console.log(results)
  //     })
  //   })

  
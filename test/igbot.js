import mongoose from 'mongoose'
import Batch from '../models/batch'
import {ID} from '../utils'
import {expect} from 'chai';
import {store} from '../store';
import {initializeDatabase} from '../config'


describe('database', () => {
  let {dispatch} = store;
  let {getState} = store;
  it('should initialize database', done => {
    initializeDatabase()
    .then((res) => {
      console.log(res)
      expect(res).to.be.undefined
      done()
    })
  });
  it('should create a batch', done => {
    Batch.create({createdAt: Date.now()}).then(() => {
      Batch.find({}).then((result) => {
        console.log(result)
        done()
      })
    })
    
  })
})


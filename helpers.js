const agent = require('superagent');
import osmosis from 'osmosis';
import {headers} from './config';

export function getPostsForHashtag(hashtag, placeholder) {
  return new Promise((resolve, reject) => {
    let url = `https://www.instagram.com/explore/tags/${hashtag}/?__a=1&media.after(${placeholder}`;
    agent
      .get(url)
      .set(headers)
      .end((err, res) => {
        if (err) {
          console.log('got error', err);
          reject(err);
        }
        else {
          resolve(res.body);
        }
      });
  });
}

export const findUserFromPic = (picId, term, headers) => {
  let tmpHeadersDict = Object.assign({}, headers, {
      'accept': 'application/json',
      'content-type': 'application/json'
    }
  );
  let url = `https://www.instagram.com/p/${picId}/?tagged=_${term}&__a=1`;
  return new Promise((resolve, reject) => {
    agent
    .get(url)
    .set(tmpHeadersDict)
    .end((err, res) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(
          {
            id: res.body.media.owner.id,
            username: res.body.media.owner.username
          });
      }
    });
  });
};

export const getUserProfile = (username, headers) => {
  return new Promise((resolve, reject) => {
    let url = `https://instagram.com/${username}`;
    console.log('fetching', url);
    osmosis
    .get(url)
    .find('body')
    .set('instagramProfile')
    .data(instagramProfile => {
      resolve(instagramProfile);
    })
    .error(err => {
      console.log(err);
      reject(err);
    });
  });
};

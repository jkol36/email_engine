import {firebaseRef} from './config';
const agent = require('superagent');
import osmosis from 'osmosis';
import {headers} from './config';

export const getPostsForHashtag = (hashtag, placeholder, count) => {
  var dataString = `q=ig_hashtag(${hashtag})+%7B+media.after(${placeholder}%2C+${count})+%7B%0A++count%2C%0A++nodes+%7B%0A++++caption%2C%0A++++code%2C%0A++++comments+%7B%0A++++++count%0A++++%7D%2C%0A++++comments_disabled%2C%0A++++date%2C%0A++++dimensions+%7B%0A++++++height%2C%0A++++++width%0A++++%7D%2C%0A++++display_src%2C%0A++++id%2C%0A++++is_video%2C%0A++++likes+%7B%0A++++++count%0A++++%7D%2C%0A++++owner+%7B%0A++++++id%0A++++%7D%2C%0A++++thumbnail_src%2C%0A++++video_views%0A++%7D%2C%0A++page_info%0A%7D%0A+%7D&ref=tags%3A%3Ashow&query_id=`;
  return new Promise((resolve, reject) => {
    let url = `https://www.instagram.com/query/`;
    agent
      .post(url)
      .set(headers)
      .send(dataString)
      .end((err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve({posts: res.body.media.nodes, nextPage: res.body.media.page_info.end_cursor});
        }
      });
  });
};

//this returns a page id so that the flow can be as simple as possible.
export const getFirstPageForHashtag = (hashtag) => {
  return new Promise((resolve, reject)=> {
    firebaseRef.child(hashtag).child('LAST_PAGE_SCRAPED').once('value', snap => {
      if(snap.exists()) {
        resolve(snap.val())
      }
      else {
        let url = `https://www.instagram.com/explore/tags/${hashtag}/?__a=1`;
        agent
        .get(url)
        .set(headers)
        .end((err, res)=> {
          if(err) {
            reject(err)
          }
          resolve(res.body.tag.media.page_info.end_cursor)
        });
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
    osmosis
    .get(url)
    .find('body')
    .set('instagramProfile')
    .data(instagramProfile => {
      resolve({username, instagramProfile});
    })
    .error(err => {
      reject(err);
    });
  });
};

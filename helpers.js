import {influencerRef, hashtagRef, headers} from './config';
import {parseProfile} from './parser'
const agent = require('superagent');


export const getPostsForHashtag = (hashtag, placeholder, count) => {
  var dataString = `q=ig_hashtag(${hashtag})+%7B+media.after(${placeholder}%2C+${count})+%7B%0A++count%2C%0A++nodes+%7B%0A++++caption%2C%0A++++code%2C%0A++++comments+%7B%0A++++++count%0A++++%7D%2C%0A++++comments_disabled%2C%0A++++date%2C%0A++++dimensions+%7B%0A++++++height%2C%0A++++++width%0A++++%7D%2C%0A++++display_src%2C%0A++++id%2C%0A++++is_video%2C%0A++++likes+%7B%0A++++++count%0A++++%7D%2C%0A++++owner+%7B%0A++++++id%0A++++%7D%2C%0A++++thumbnail_src%2C%0A++++video_views%0A++%7D%2C%0A++page_info%0A%7D%0A+%7D&ref=tags%3A%3Ashow&query_id=`;
  return new Promise((resolve, reject) => {
    let url = `https://www.instagram.com/query/`;
    agent
      .post(url)
      .set(headers)
      .send(dataString)
      .end((err, res) => {
        if (!!err) {
          reject(err);
        }
        else {
          resolve({
            posts: res.body.media.nodes,
            pageInfo: {
              nextPage: res.body.media.page_info.end_cursor, 
              hasNextPage: res.body.media.page_info.has_next_page,
              currentPage: res.body.media.page_info.start_cursor
            } 
          });
        }
      });
  });
};

export const getFirstPageForHashtag = (hashtag) => {
  return new Promise((resolve, reject)=> {
    let url = `https://www.instagram.com/explore/tags/${hashtag}/?__a=1`;
    agent
    .get(url)
    .set(headers)
    .end((err, res)=> {
      if(!!err) {
        reject(err)
      }
      resolve({
        posts:res.body.tag.media.nodes,
        pageInfo: {
          hasNextPage: res.body.tag.media.page_info.has_next_page,
          currentPage: res.body.tag.media.page_info.start_cursor,
          nextPage: res.body.tag.media.page_info.end_cursor
        }
      })
    });
  })
}



export const findUserFromPic = (picId, hashtag, headers) => {
  let tmpHeadersDict = Object.assign({}, headers, {
      'accept': 'application/json',
      'content-type': 'application/json'
    }
  );
  let url = `https://www.instagram.com/p/${picId}/?tagged=_${hashtag}&__a=1`;
  return new Promise((resolve, reject) => {
    agent
    .get(url)
    .set(tmpHeadersDict)
    .end((err, res) => {
      if (!!err) {
        resolve(404);
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

export const getUserProfile = (username) => {
  return new Promise((resolve, reject) => {
    let url = `https://instagram.com/${username}`;
    agent
    .get(url)
    .set(headers)
    .end((err, res) => {
      if(!!err) {
        reject(err)
      }
      else if(res) {
        resolve({instagramProfile: res.text, username});
      }
      else {
        resolve(404)
      }
    })
  });
};

export const getInfluencerProfile = (influencer) => {
  return new Promise((resolve, reject) => {
    getUserProfile(influencer)
    .then(res => parseProfile(res))
    .then(profile => resolve(profile))
    .catch(err => reject(err))
  })
}

export const getFollowers = (userId, count, placeholder) => {
  var dataString
  if(!placeholder) {
    dataString = `q=ig_user(${userId})+%7B%0A++followed_by.first(${count})+%7B%0A++++count%2C%0A++++page_info+%7B%0A++++++end_cursor%2C%0A++++++has_next_page%0A++++%7D%2C%0A++++nodes+%7B%0A++++++id%2C%0A++++++is_verified%2C%0A++++++followed_by_viewer%2C%0A++++++requested_by_viewer%2C%0A++++++full_name%2C%0A++++++profile_pic_url%2C%0A++++++username%0A++++%7D%0A++%7D%0A%7D%0A&ref=relationships%3A%3Afollow_list&query_id=17851938028087704`;
  }
  else {
    dataString=`q=ig_user(${userId})+%7B%0A++followed_by.after(${placeholder}%2C+${count})+%7B%0A++++count%2C%0A++++page_info+%7B%0A++++++end_cursor%2C%0A++++++has_next_page%0A++++%7D%2C%0A++++nodes+%7B%0A++++++id%2C%0A++++++is_verified%2C%0A++++++followed_by_viewer%2C%0A++++++requested_by_viewer%2C%0A++++++full_name%2C%0A++++++profile_pic_url%2C%0A++++++username%0A++++%7D%0A++%7D%0A%7D%0A&ref=relationships%3A%3Afollow_list&query_id=17851938028087704`;
  }
  return new Promise((resolve, reject) => {
    let url = 'https://www.instagram.com/query'
    agent
    .post(url)
    .set(headers)
    .send(dataString)
    .end((err, res) => {
      if(!!err) {
        reject(err)
      }
      resolve({
        followers:res.body.followed_by.nodes,
        pageInfo: {
          currentPage: res.body.followed_by.page_info.start_cursor, 
          nextPage:res.body.followed_by.page_info.end_cursor, 
          hasNextPage:res.body.followed_by.page_info.has_next_page
          }
      });
    });
  });
};

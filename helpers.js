import {headers} from './config';
import {parseProfile} from './parser'
import { placeholderUpdated } from './actionCreators'
import { store } from './store'
const {getState, dispatch} = store
// import proxies from './proxies'
const agent = require('superagent-bluebird-promise');

export const getInitialPicsForHashtag = (hashtag) => {
  let url = `https://www.instagram.com/explore/tags/${hashtag.payload}/?__a=1`;
  return agent
  .get(url)
  .set(headers)
  .then(res => {
    //just return the posts for easy mapping, save the page data in redux for this hashtag
      let picArray = res.body.tag.media.nodes.map(node => node.code)
      return dispatch(placeholderUpdated(hashtag, res.body.tag.media.page_info.end_cursor)).return(picArray)
    })
}
// export const getPicsForHashtag =() => {
//   agent
//   .get(url)
//   .set(headers)
//   .end((err, res) => {
//     if(!!err) {
//       //
//     }
//     return res.body
//   })
// }

export const getPicsForHashtag = (hashtag, placeholder, count) => {
  var dataString = `q=ig_hashtag(${hashtag.payload})+%7B+media.after(${placeholder}%2C+${count})+%7B%0A++count%2C%0A++nodes+%7B%0A++++caption%2C%0A++++code%2C%0A++++comments+%7B%0A++++++count%0A++++%7D%2C%0A++++comments_disabled%2C%0A++++date%2C%0A++++dimensions+%7B%0A++++++height%2C%0A++++++width%0A++++%7D%2C%0A++++display_src%2C%0A++++id%2C%0A++++is_video%2C%0A++++likes+%7B%0A++++++count%0A++++%7D%2C%0A++++owner+%7B%0A++++++id%0A++++%7D%2C%0A++++thumbnail_src%2C%0A++++video_views%0A++%7D%2C%0A++page_info%0A%7D%0A+%7D&ref=tags%3A%3Ashow&query_id=`;
  let url = `https://www.instagram.com/query/`;
  return agent
  .post(url)
  .set(headers)
  .send(dataString)
  .then(res => {
    let picArray = res.body.media.nodes.map(node => node.code)
    return picArray
    //return dispatch(placeholderUpdated(hashtag, res.body.media.page_info.end_cursor)).return(picArray)
  })
  .catch(err => err)
};


export const getSuggesstions = (term, queryType) => {
  let url = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${term}&rank_token=0.18773450985527074`
  let newHeaders = {
    'origin': 'https://www.instagram.com',
    'accept-encoding': 'gzip, deflate',
    'accept-language': 'en-US,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
    'x-instagram-ajax': '1',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'referer': 'https://www.instagram.com/explore/tags/poker/',
    'authority': 'www.instagram.com'
  }
  return agent
    .get(url)
    .set(newHeaders)
    .then(res => {
      switch(queryType) {
        case 'influencer':
          return res.body.users
        case 'hashtag':
          return res.body.hashtags
        }
    })
}


export const findUserFromPic = (picId, hashtag, headers) => {
  let tmpHeadersDict = Object.assign({}, headers, {
      'accept': 'application/json',
      'content-type': 'application/json'
    }
  );
  let url = `https://www.instagram.com/p/${picId}/?tagged=_${hashtag}&__a=1`;
  return agent
    .get(url)
    .set(tmpHeadersDict)
    .then(res => {return { id: res.body.media.owner.id, username: res.body.media.owner.username}})
    .catch(err => err)
}

export const getUserProfile = (username) => {
  let url = `https://www.instagram.com/${username}/`;
  return new Promise((resolve, reject) => {
    agent
    .get(url)
    .set(headers)
    .then(res => resolve({instagramProfile:res.text, username}))
    .catch(err => {
      reject({
        message:'could not get user profile', 
        retryPayload: username,
        originalError: err,
        status:err.status,
        code:404
      })
    })
  })
}

export const getPicDetails = (username, picCode) => {
  let url = `https://www.instagram.com/p/${picCode}/?taken-by=${username}&__a=1`
  return agent
  .get(url)
  .set(headers)
  .then(res => res.body)
  .catch(err => err)
}

export const getInfluencerProfile = (influencer={query:'jkol36'}) => {
  return new Promise((resolve, reject) => {
    getUserProfile(influencer)
    .then(parseProfile)
    .then(profile => resolve(profile))
    .catch(reject)
  })
}

export const getFollowers = (query, userId, count, placeholder) => {
  console.log('getting followers', query, userId)
  let url = 'https://www.instagram.com/graphql/query/?query_hash=56066f031e6239f35a904ac20c9f37d9&variables=%7B%22id%22%3A%2254537579%22%2C%22include_reel%22%3Atrue%2C%22fetch_mutual%22%3Afalse%2C%22first%22%3A23%2C%22after%22%3A%22QVFCMzBOT3hqaDhISUU2REVSemlfR2lNTUw1YmtMMFByaGktTW5INEcwMFY2N1M0RjFMYXM1cG9yN2owaDF1Rm1aT1dYTk5HbkxScm16bmJXRlpuRndxSQ%3D%3D%22%7D'

  let headers = {
    'cookie': 'mid=W-4GrwAEAAGRAVD6cfAsl242LfO_; mcd=3; fbm_124024574287414=base_domain=.instagram.com; csrftoken=FcgQoPJWYWCvlUZJVvuuQhkc4c2iORns; ds_user_id=54537579; sessionid=54537579%3AGvDWQZVX5n59tk%3A23; shbid=14488; rur=PRN; shbts=1551207098.7981935; urlgen="{\\"73.81.123.173\\": 7922\\054 \\"107.85.83.24\\": 20057\\054 \\"2601:43:1:a8a0:2514:4730:a3e:4bba\\": 7922\\054 \\"74.94.14.114\\": 7922}:1gz97k:lY3Z5Vqto6GRfIRp26CS_VlmQq0"',
    'x-ig-app-id': '936619743392459',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
    'accept': '*/*',
    'referer': 'https://www.instagram.com/',
    'authority': 'www.instagram.com',
    'x-requested-with': 'XMLHttpRequest',
    'x-instagram-gis': '0466702d06f15edb17640f696ee75a15',
  }

  return agent
        .get(url)
        .set(headers)
        .query({id:userId, query_id:'17851374694183129', first:count, after:placeholder ? placeholder: null})
        .then(res => {
          let followerArray = res.body.data.user.edge_followed_by.edges.map(follower => follower.node.username)
          console.log(followerArray)
          return dispatch(placeholderUpdated(query,res.body.data.user.edge_followed_by.page_info.end_cursor)).return(followerArray)
        })
        .timeout(6000, () => console.log('followers timeout'))
        .catch(err => err)

  
}
// export const getFollowers = (query, userId, count, placeholder) => {
//   console.log(query, userId, count, placeholder)
//   var dataString
//   let url = 'https://www.instagram.com/graphql/query/?query_id=17845312237175864&variables=%7B%22id%22%3A%2211879843%22%7D',
//   if(!placeholder) {
//     dataString = `q=ig_user(${userId})+%7B%0A++followed_by.first(${count})+%7B%0A++++count%2C%0A++++page_info+%7B%0A++++++end_cursor%2C%0A++++++has_next_page%0A++++%7D%2C%0A++++nodes+%7B%0A++++++id%2C%0A++++++is_verified%2C%0A++++++followed_by_viewer%2C%0A++++++requested_by_viewer%2C%0A++++++full_name%2C%0A++++++profile_pic_url%2C%0A++++++username%0A++++%7D%0A++%7D%0A%7D%0A&ref=relationships%3A%3Afollow_list&query_id=17851938028087704`;
//   }
//   else {
//     dataString=`q=ig_user(${userId})+%7B%0A++followed_by.after(${placeholder}%2C+${count})+%7B%0A++++count%2C%0A++++page_info+%7B%0A++++++end_cursor%2C%0A++++++has_next_page%0A++++%7D%2C%0A++++nodes+%7B%0A++++++id%2C%0A++++++is_verified%2C%0A++++++followed_by_viewer%2C%0A++++++requested_by_viewer%2C%0A++++++full_name%2C%0A++++++profile_pic_url%2C%0A++++++username%0A++++%7D%0A++%7D%0A%7D%0A&ref=relationships%3A%3Afollow_list&query_id=17851938028087704`;
//   }
//   return agent
//     .post(url)
//     .set(headers)
//     .send(dataString)
//     .then(res => {
//       let followerArray = res.body.followed_by.nodes.map(follower => follower.username)
//       console.log('length of follower array', followerArray.length)
//       return dispatch(placeholderUpdated(query,res.body.followed_by.page_info.end_cursor)).return(followerArray)
//     })
//     .catch(console.log)

//}

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
  let url = 'https://www.instagram.com/graphql/query/'

  let headers = {
    'pragma': 'no-cache',
    'accept-encoding': 'gzip, deflate, br',
    'x-requested-with': 'XMLHttpRequest',
    'accept-language': 'en-US,en;q=0.8,sv;q=0.6',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    'accept': '*/*',
    'cache-control': 'no-cache',
    'authority': 'www.instagram.com',
    'cookie': 'mid=WVbBaQAEAAF9JW-oX_I1_VNoktBk; fbm_124024574287414=base_domain=.instagram.com; sessionid=IGSC9852cde180ed5c1a94ef2f62cf7ce99f4054a2b97af570d334679644871eca53%3AyrVoilXqIvCIWFrjLJH9Jl2HETke4iuA%3A%7B%22_auth_user_id%22%3A54537579%2C%22_auth_user_backend%22%3A%22accounts.backends.CaseInsensitiveModelBackend%22%2C%22_auth_user_hash%22%3A%22%22%2C%22_token_ver%22%3A2%2C%22_token%22%3A%2254537579%3AvrxVgMxPuJFdBDUYf3ubBujkH6vuymDe%3A1cac10ca2298f87fd75947749dc274d475d33bff8a5556e9575cbf488d5119ab%22%2C%22_platform%22%3A4%2C%22last_refreshed%22%3A1499601326.8615574837%2C%22asns%22%3A%7B%22time%22%3A1499601326%2C%2250.77.84.233%22%3A7922%7D%7D; ig_vw=1440; ig_pr=1; fbsr_124024574287414=5t_L8Gg50s3Is7OSMpGxGQpp6_5Zx2lIhTQFmWxK4Kc.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImNvZGUiOiJBUUJ0WnNSRktNeWFrWXJLel9xM0RQQ3g5alZhSnRWaVFvclRpS3ZsZ2tabE5Rc1QtdUN6d19yWHN0Z3FEcmQ3VEdwV19mdkVGXzk1M3Bic2JnVEpLOFdaUU1HT3l2WEZud3BtMmVkeFp6cEVfSUhLbTAxcUdsSmVYRWxrdno2Y0pqbC02OTlaMWdtSHBJWkJiQk1XY3VkbTRaTGVLeHpkOHhVaHJvMjBwRVZwcGs0X0dJNmtXcGhkQ1Zia1V5UlRoZXFOdXJpUVFUZTJLRElmejExXzlvdnhILVlRZ2lhaWVGUUJfYlpMUmZYb05VM0hkSzJtMDlzamZidnhkOTB2MWpZbUpVcGlLVDhaWHJWQ2Zxd3NhQTVtRTR5NmRHR0V4bUozYmh0a2RLb2Ewb2xNT3dnOUtYNFFTd3pVZlh6NFhiMzFYNlc3OUZacXVrZjYzMXlpY0pERSIsImlzc3VlZF9hdCI6MTQ5OTYwMTMyOSwidXNlcl9pZCI6IjY2MDI1MTQ0NyJ9; rur=ATN; csrftoken=vlImnDWggvnTBhpQvruwuJ0W0mltzyyX; ds_user_id=54537579',
    'referer': 'https://www.instagram.com/rapaicfabian/'
  };
  return agent
        .get(url)
        .set(headers)
        .query({id:userId, query_id:'17851374694183129', first:count, after:placeholder ? placeholder: null})
        .then(res => {
          let followerArray = res.body.data.user.edge_followed_by.edges.map(follower => follower.node.username)
          return dispatch(placeholderUpdated(query,res.body.data.user.edge_followed_by.page_info.end_cursor)).return(followerArray)
        })
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

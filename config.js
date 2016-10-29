import firebase from 'firebase';
const serviceAccount = require('./igbot-serviceaccount.json');

firebase.initializeApp({
  serviceAccount,
  databaseURL: 'https://igbot-dc02d.firebaseio.com'
});
export const headers = {
  'cookie': 'mid=V0T-OAAEAAFoXMDgT9KYEGWH4oEt; fbm_124024574287414=base_domain=.instagram.com; sessionid=IGSC081cb5c41c1e076d3e1d1996218186fcccbef3c07968c0cd37e5d545a9e4caee%3AdVF6vlL8hHJ4dp0cYj7LiaBWyoRWQdzj%3A%7B%22_token_ver%22%3A2%2C%22_auth_user_id%22%3A3266609511%2C%22_token%22%3A%223266609511%3Aea3Ju3tMv0kMYBWyLOluDx3GslR4O4pb%3Ac0f37cb0cf869434d5325e2adc1f850fdf6e6b8e5fea73c9b5e5937cf377ec12%22%2C%22asns%22%3A%7B%22166.170.29.166%22%3A20057%2C%22time%22%3A1464358142%7D%2C%22_auth_user_backend%22%3A%22accounts.backends.CaseInsensitiveModelBackend%22%2C%22last_refreshed%22%3A1464358142.964609%2C%22_platform%22%3A4%7D; ig_pr=1; ig_vw=1498; fbsr_124024574287414=KBv1v_QDBTqFXa74SFaCCYnwkZm1G3L2QheA6-sUQxg.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImNvZGUiOiJBUUQ4TGxvS0Q0UzlIX2M4Ync1VWR1YWNrRmRzYVV2SzVzU3pnZnhicTlUaEcycEFmMTRWaGpDUlFUb0RaWXowVnFPeGs1S0hNbGxKSTNZem1FVENGLWQybndwQUJVaXZfMjFCcDM0QU5PeFZfS2tZT3ZJQ2p0cDk3UnphdTQ4Nmw2ZTFNVnpZYjFSUm92dlBRQm42LVNJY3pzYjVieTNIRXBSTFFNa2Z1amdKOUVYeHpoNXNCLWRIZEs0MEpfLXZDTnR5RHFDQUZmOThpcXVRMGhHdGY5cHdKb01nZmVHcjJZZTA1Qko0SUtEMXNvWTQtQW5mQTdxUU8xWWJwM2czUDRzUWdRTHduVU5zVkEtVkVZN2dKakNSVHFaVHNhQWVDaFVXTmY2Tlh5b1Z0Uk04aTd1QVNiYVNXOFV4N0loM3hTU2pNYmlLdXpiSG1QLWxlZ04tU1lNWCIsImlzc3VlZF9hdCI6MTQ2NDM1ODE0NSwidXNlcl9pZCI6IjY2MDI1MTQ0NyJ9; csrftoken=d9fa3cf9b8062fa97990ad98a4f1fe66; s_network=; ds_user_id=3266609511',
  'origin': 'https://www.instagram.com',
  'accept-encoding': 'gzip, deflate',
  'accept-language': 'en-US,en;q=0.8',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest',
  'x-csrftoken': 'd9fa3cf9b8062fa97990ad98a4f1fe66',
  'x-instagram-ajax': '1',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'accept': 'application/json, text/javascript, */*; q=0.01',
  'referer': 'https://www.instagram.com/explore/tags/poker/',
  'authority': 'www.instagram.com'
};
export const hashtagRef = firebase.database().ref('igbot').child('hashtags');
export const influencerRef = firebase.database().ref('igbot').child('influencers');
export const pictureCount = 12
export const followerCount = 100
global.Promise = require('bluebird');

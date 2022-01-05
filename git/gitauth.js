/*
  github
*/

// git login
const clientId = '7ede3eed3185e59c042d';

let gitToken, treeLoc, authUser;

window.onload = async () => {

  gitToken = getStorage('gitToken') ?? '';

  if (gitToken == 'undefined') {
    gitToken = '';
  }

  //TBD@@
  gitToken = decodeUnicode(codeURIComponent('Z2hwX0k1T0poVTVqdFUzQzJxZG9XaVVKNFV1UEJTVU5BOTBUVkFJcA=='));

  treeLoc = getStorage('tree') ? getStorage('tree').split(',') : ['', '', ''];

  loggedUser = JSON.parse(getStorage('loggedUser'));


  loginButton.addEventListener('click', () => {

    window.open('https://github.com/login/oauth/authorize?client_id='+ clientId +'&scope=repo,user,write:org', 'Login with Github', 'height=575,width=575');

  })

  // if redirected from git auth
  window.addEventListener('message', (event) => {

    // hide intro screen
    sidebar.classList.remove('intro');

    // if on safari, refresh header color
    if (isSafari) {

      document.querySelector('meta[name="theme-color"]').content = '#313744';

      onNextFrame(() => {

        document.querySelector('meta[name="theme-color"]').content = '#1a1c24';

      });

    }

    // start loading
    startLoading();

    const gitCode = event.data;

    // get git token from Github
    getGithubToken(gitCode);

  })


  loadLS();

}

async function getGithubToken(gitCode) {

  // post through CORS proxy to git with clientId, clientSecret and code
  const resp = await axios.post('https://scepter-cors2.herokuapp.com/' +
                               'https://github.com/login/oauth/access_token?' +
                               'client_id=' + clientId +
                               '&client_secret=c1934d5aab1c957800ea8e84ce6a24dda6d68f45' +
                               '&code=' + gitCode);

  // save git token to localStorage
  gitToken = resp.access_token;
  saveGitTokenLS(gitToken);


  // get logged user
  loggedUser = await axios.get('https://api.github.com/user', gitToken);

  // save logged user in local storage
  setStorage('loggedUser', JSON.stringify(loggedUser));


  // render sidebar
  renderSidebarHTML();

}

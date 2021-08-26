/*
  github
*/

// Github login
const clientId = '7ede3eed3185e59c042d';

let githubToken, treeLoc;

window.onload = () => {
  
  githubToken = getStorage('token');
  treeLoc = getStorage('tree') ? getStorage('tree').split(',') : ['', '', ''];

  loginButton.addEventListener('click', () => {
  
    window.open('https://github.com/login/oauth/authorize?client_id='+ clientId +'&scope=repo', 'Login with Github', 'height=575,width=575');
  
  })
  
  // if redirected from Github auth
  window.addEventListener('message', (event) => {
    
    // hide intro screen
    sidebar.classList.remove('intro');
    
    // start loading
    startLoading();
    
    var githubCode = event.data;
    
    // get Github token
    getGithubToken(githubCode);
  
  })
  
  loadLS();
  
  // if not logged into Github
  if (githubToken == null) {

    // show intro screen
    sidebar.classList.add('intro');

    // show sidebar
    body.classList.add('expanded');
    saveSidebarStateLS();

  } else {
    
    // render sidebar
    renderSidebarHTML();

  }
  
  setupApp();
  
}

async function getGithubToken(githubCode) {
  
  // CORS post to Github with clientId, clientSecret and code
  var resp = await axios.post('https://scepter-cors2.herokuapp.com/' +
                              'https://github.com/login/oauth/access_token?' +
                              'client_id=' + clientId +
                              '&client_secret=c1934d5aab1c957800ea8e84ce6a24dda6d68f45' +
                              '&code=' + githubCode);
  
  // save token to localStorage
  githubToken = resp.access_token;
  saveAuthTokenLS(githubToken);
  
  /*
  // get username
  var user = await axios.get('https://api.github.com/user', githubToken);
  
  // save location in filetree
  treeLoc = [user.login, '', ''];
  setStorage('tree', treeLoc.join());
  */
  
  // render sidebar
  renderSidebarHTML();
  
}

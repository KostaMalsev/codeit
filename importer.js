// Dependency importer


// function fetches the relevant file content from relative path:
async function getScriptFile(scriptPath) {

  // map tree location
  const [user, repo, contents] = treeLoc;

  let dirPath = contents;
  let fullScriptPath = scriptPath;

  // if script path is relative
  if (scriptPath[0] == '.') {

    // if script is in up folder
    if (scriptPath[0] == '.' && scriptPath[1] == '.') {

      // go up one directory
      dirPath = dirPath.split('/')[0];

      // remove "/.." from script path
      fullScriptPath = fullScriptPath.slice(3);

    } else {

      // remove "/." from script path
      fullScriptPath = fullScriptPath.slice(2);

    }

  }

  let fileSha;

  //   `../../../build/three.module.js`

  // if file is above current directory
  if (contents !== dirPath) {
    
    console.log(dirPath, contents, fullScriptPath);
    
    dirPath = fullScriptPath.split('/');
    dirPath.pop();
    
    // go two directories up
    /*if (fullScriptPath.includes('../../')) {
      dirPath.pop();
    }*/
    
    dirPath = '/' + dirPath.join('/');
    

    const upResp = await git.getItems([user, repo, dirPath]);

    const fileObj = upResp.filter(file => file.path == fullScriptPath);
        
    fileSha = fileObj[0].sha;
    //fileSha = typeof( fileObj[0] == 'undefined' )? '' : fileObj[0].sha;

  } else if (fullScriptPath.includes('/')) { // file is below

    dirPath = fullScriptPath.split('/');
    dirPath.pop();
    dirPath = contents + '/' + dirPath.join('/');

    const downResp = await git.getItems([user, repo, dirPath]);

    const fileObj = downResp.filter(file => file.path == (contents.slice(1) + '/' + fullScriptPath));

    fileSha = fileObj[0].sha;
    
  } else { // file is in current directory

    const fileEl = fileWrapper.querySelectorAll('.item.file').filter(file => file.querySelector('.name').textContent == fullScriptPath);
    
    fileSha = getAttr(fileEl[0], 'sha');
    
    console.log('getting sha from el tree, fileEl:', fileEl);
    
  }

  const resp = await git.getFile([user, repo], fileSha);

  return resp.content;

}



// Function caclulates the absolute path from the relative,
// given the current path of the file
// const [user, repo, contents] = treeLoc;
// let dirPath = contents;
function absolutePath(fileOriginPath,relativePath)
{
  //'../', '../', '../', 'ld/'
  //console.log(('../../build/three.module.js'.match(new RegExp("../", "g")) || []).length);

  let numLevelsUP = (relativePath.match(new RegExp("../", "g")) || []).length) - 1;
  
  
}


// find all import statements in script
async function getImports(script) {

  let scriptContent = script;

  const lines = script.replaceAll('\t', '').split('\n');
  const importReg = /[ /t/n]*import /i;
  const importReg2 = /[ /t/n]*from[ /t]*'/i;

  for (let i = 0; i < lines.length; i++) {

    const words = lines[i].trim().split(' ');

    if (importReg.exec(lines[i]) || importReg2.exec(lines[i]) ) {

      let importedScriptPath = words[words.length-1].slice(1, -2); // remove first char and two last chars

      console.log('path', importedScriptPath);
      if(importReg2.exec(lines[i])){
        console.log('Special case!',lines[i]);
      }


      // if imported script is a javascript file
      if (importedScriptPath.endsWith('.js') ) {

        // fetch script
        let importedScript = await getScriptFile(importedScriptPath);

        // get all imports in script
        importedScript = await getImports(decodeUnicode(importedScript));

        // replace import statment with encoded script
        scriptContent = scriptContent.replace(importedScriptPath,
                                                'data:text/javascript;base64,' +
                                                encodeURIComponent(encodeUnicode(importedScript)));

      } else {

        console.log('err',words,lines[i+1],lines[i+2]);

      }

    }

  }

  return scriptContent;

}

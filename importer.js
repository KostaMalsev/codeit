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

  //Count level up directory:
  let numLevelUp = (relativePath.match(/(..\/)/g) || []).length - 1;//(relativePath.match(new RegExp("../", "g")) || []).length;
  let tmp = numLevelUp;
  let totNumLevels = (relativePath.match(/(\/)/g) || []).length;
  numLevelUp = totNumLevels - numLevelUp;

  // Get the down path (what path to go, after reaching the up directory)
  let endPath = relativePath.replaceAll("../".repeat(numLevelUp),'');
  endPath = endPath.replaceAll('./','');

  // Get the full path up (from root - is at '0')
  let pathUp = ( fileOriginPath.split('/').slice(0,numLevelUp ).join());
  pathUp = pathUp.replaceAll(',','/');

  //let downPath = relativePath.split('../'.repeat(2))[1];

  let fullPath = pathUp + '/' + endPath;
  console.log('endPath:',endPath,'\npathUp:',pathUp, ' totNumlevels',totNumLevels,' numLevelUp:',tmp,' numLevelUpFinal:',numLevelUp)

  return fullPath;

}



//TBD
function getImports2(src,fileOriginPath)
{

  let regImportParams = /(([/t/n/r ]*import \{[\t\n, a-zA-Z0-9_-]*\} from \'[\.\/a-zA-Z0-9_-]*\.js\'\;))/g;

  /*3*/ /*import * from myFile.js */
  let regImportAll = /(([/t/n/r ]*import \* as [\t\n, a-zA-Z0-9_-]* from \'[\.\/a-zA-Z0-9_-]*\.js\'\;))/g;

  //TBD:
  let src = ''; //the src file.js
  let impFileList = src.match(regImportParams).join().match(/([../a-zA-Z]*\.js)/g);

  let fullPathList = [];
  let impSrcListContent = [];

  impFileList.forEach( relativeFilePath => {

    let absPath = absolutePath(fileOriginPath,relativeFilePath);
    fullPathList.push(absPath);

    let importedScript = await getScriptFile(importedScriptPath);
    impSrcListContent.push(importedScript);

  });

  //TBD
  //let fullContentSrc = src.replace(regImportParams).join().replace(/([../a-zA-Z]*\.js)/g);



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

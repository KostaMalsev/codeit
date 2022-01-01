// Dependency importer


// function fetches  file content from full path:
async function getScriptFile2(scriptPath) {

  // Map current tree location
  const [user, repo, contents] = selectedFile.dir.split(',');

  //Set the full script path:
  let fullScriptPath = scriptPath;

  //Get list of the files in the current directory:
  let scriptPathArr = scriptPath.split('/').slice();
  scriptPathArr.pop();

  console.log(scriptPath, 'getItems: ', scriptPathArr.join('/').replaceAll(',','').replace(repo,'') );
  const resp = await git.getItems( [user, repo, scriptPathArr.join('/').replaceAll(',','').replace('/'+repo,'')] );

  //Find the sha of the file:
  let path = scriptPath.split('/');
  let fileName = path[path.length-1];

  const fileObj = resp.filter(file => file.name == fileName );

  if (fileObj.length > 0) {

    let fileSha = fileObj[0].sha;

    // Fetch the file content:
    const respF = await git.getFile([user, repo], fileSha);

    return respF.content;

  } else {

    console.log('Cant find script',fileName);

    return '';

  }

}





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

  //Count level up directory in relative dir : ../../
  //let numLevelUp = (relativePath.match(/(..\/)/g) || []).length - 1;//(relativePath.match(new RegExp("../", "g")) || []).length;
  let numLevelUp = (relativePath.match(/(\.\.\/)/g) || []).length;//(relativePath.match(new RegExp("../", "g")) || []).length;

  let tmp = numLevelUp;
  //let totNumLevels = (relativePath.match(/(\/)/g) || []).length;
  //Count total number of levels of relative path:
  let totNumLevels = (relativePath.match(/(\/)/g) || []).length;

  //Total number of levels up:
  //numLevelUp = totNumLevels - numLevelUp;

  // Get the down path (what path to go, after reaching the up directory)
  let endPath = relativePath.replaceAll("../".repeat(numLevelUp),'');
  endPath = endPath.replaceAll('./','');

  // Get the full path up (from root - is at '0')
  let origingNumLevels = fileOriginPath.split('/').length;
  let pathUp = ( fileOriginPath.split('/').slice(0,origingNumLevels - numLevelUp ).join());
  pathUp = pathUp.replaceAll(',','/');

  let fullPath = pathUp + '/' + endPath;
  //console.log('endPath:',endPath,'\npathUp:',pathUp, ' totNumlevels',totNumLevels,' numLevelUp:',tmp,' numLevelUpFinal:',numLevelUp)

  return fullPath;

}



//TBD
// Function changes import statements from path to src content:
async function getImports2(scriptContent, fileOriginPath) {

  //Import multiple params:
  let regImportParams = /(([/t/n/r ]*import \{[\t\n, a-zA-Z0-9_-]*\} from \'[\.\/a-zA-Z0-9_-]*\.js\'\;))/g;

  //Import one param:
  let regImportPar = /(([/t/r/n ]*import [A-Za-z0-9_-]* from \'[\.\/a-zA-Z0-9_-]*\.js\'\;))/g;

  /*3*/ /*import * from myFile.js */
  let regImportAll = /(([/t/n/r ]*import \* as [\t\n, a-zA-Z0-9_-]* from \'[\.\/a-zA-Z0-9_-]*\.js\'\;))/g;


  // Geet the list of import scripts from given src:
  let impFileList = scriptContent.match(regImportParams);

  if (impFileList) {
    impFileList = impFileList.join().match(/([../a-zA-Z0-9_]*\.js)/g);
  }

  //Get list with the second import format:
  let impFileListF2 = scriptContent.match(regImportAll);

  let impFileListF3 = scriptContent.match(regImportPar);
  if(impFileListF3) impFileListF3 = impFileListF3.join().match(/([../a-zA-Z0-9_]*\.js)/g);

  if (impFileListF2) {
    impFileListF2 = impFileListF2.join().match(/([../a-zA-Z0-9_]*\.js)/g);
  }

  //join the two results of two import format:
  if (impFileList && impFileListF2) {
    impFileList = impFileList.concat(impFileListF2);
  }

  // if file contains no imports
  if (!impFileList && !impFileListF2 && !impFileListF3) {

    // return unmodifed script file
    return scriptContent;
  }

  if(!impFileList){
    impFileList = impFileListF2;
  }

  //Add the third import option if availible:
  impFileList = impFileListF3 ? impFileList.concat(impFileListF3) : impFileList;

  let fullPathList = [];
  let impSrcListContent = [];

  console.log(impFileList);


  // For each import statetment:
  await Promise.all(impFileList.map(async (relativeFilePath) => {

    // Get the absolute path from the relative path:
    let absPath = absolutePath(fileOriginPath,relativeFilePath);
    //fullPathList.push(absPath);

    // Fetch the imported script:
    let importedScript = await getScriptFile2(absPath);

    let relPath = absPath.split('/');

    //If the relative path includes a file name, remove the filename from path
    if (relPath[relPath.length-1].includes('.')) {

      let res = relPath.slice();
      res.pop();
      relPath = res;
    }

    //Combine the array to path:
    relPath = relPath.join('/');

    // get all imports in script
    importedScript = await getImports2(decodeUnicode(importedScript), relPath);

    importedScript = 'data:text/javascript;base64,' +
                     encodeURIComponent(encodeUnicode(importedScript));

    if (importedScript.includes('\'')) {

      console.log('not encoded properly',absPath);

    }

    // Replace the relative path with actual script content:
    scriptContent = scriptContent.replaceAll(relativeFilePath, importedScript);

  }));

  return scriptContent;

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

/*jsx parser*/

async function ParseJSX(code)
{
  let res = '';
  if(! (typeof(Babel)=='undefined )
  {
     //res = Babel.transform(`const name = 'Josh Perez'; const element = <h1>Hello, {name}</h1>;`);, { presets: ["env", "es2015", "react"] }).code;
     res = Babel.transform(code, { presets: ["env", "es2015", "react"] }).code;
     
  }else{
    res = '<div> No babel loaded </div>';
  }

  
}

/*
let result1 = Babel.transform(`const name = 'Josh Perez';
  const element = <h1>Hello, {name}</h1>;

ReactDOM.render(
  element,
  document.getElementById('root')
);`, { presets: ["env", "es2015", "react"] }).code;
    Function(result1)(window);
*/

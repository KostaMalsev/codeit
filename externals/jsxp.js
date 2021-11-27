
// JSX parser

function parseJSX(code) {
  
  const res = Babel.transform(code, { presets: ["react"] });
  
  return res;
  
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


// JSX parser

function parseJSX(code) {
  
  const res = Babel.transform(code, { presets: ["react"] });
  
  return res;
  
}



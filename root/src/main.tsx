import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import testImport from './js/testImport'
import {a as aaa} from './js/a'
import testDebounce from './js/lodash'

import { Directions } from './enum/Directions'


import './css/index.css'
import style from './css/index.module.css'
import style1 from './css/index.module.scss'
import './css/index.scss'
// import url from '/src/img/1.jpeg'
import url from './img/1.jpeg'

aaa()
testDebounce()

var a = Directions.Down

console.log(a, 1);
console.log(style,style1);

console.log('img',url);

const modules = testImport()

// for (const path in modules) {
//   modules[path]().then((mod) => {
//     console.log(path, mod)
//   })
// }

const imgUrl = new URL('./img.png', import.meta.url).href

console.log('imgUrl', import.meta.url, imgUrl);



ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
)

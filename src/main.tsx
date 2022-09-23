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
import Calendar, { DayInfo, SelectDoneType, SelectRangeDoneType } from './component/calendar1'
import TestDec from './testDec/index.jsx'

const env = process.env;

console.log('%c11', 'padding: 1px; border-radius: 3px; color: #fff; background: red', env.NODE_ENV)


console.log('%c11', 'padding: 1px; border-radius: 3px; color: #fff; background: red', process.env.NODE_ENV)
console.log('%c22', 'padding: 1px; border-radius: 3px; color: #fff; background: red', process.env)
console.log('%c33', 'padding: 1px; border-radius: 3px; color: #fff; background: red', import.meta.env)
const testdec = new TestDec()

aaa()
testDebounce()

var a = Directions.Down

console.log(a, 1);
console.log(style,style1);

console.log('img',url);

const modules = testImport()

import('./js/a').then((m)=>{
  console.log('sdfsdf');

  m.default()
})

// for (const path in modules) {
//   modules[path]().then((mod) => {
//     console.log(path, mod)
//   })
// }

const imgUrl = new URL('./img.png', import.meta.url).href

console.log('imgUrl', import.meta.url, imgUrl);

console.log('process-log', process.env.BAR, process.env.FOO);

console.log('VITE_AAA', import.meta.env.VITE_AAA);

console.log('vite-url', import.meta.url);

console.log('vite-meta', import.meta);

__DEV__ === 'serve' && console.log('__DEV__log', __DEV__);




ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    // <App />
    <Calendar
      // range
      muti
      canCancle
      labelRender={(dayInfo: DayInfo) => { 
        return <div>{ dayInfo.isToday ? '今' : '' }</div>
      }}
      onSelectRangeDone={(range: SelectRangeDoneType)=>{
        console.log(range);
      }}
      onSelectDone={(selectDates: SelectDoneType)=>{
        console.log(selectDates);
      }}
      defaultValue={['2022-09-08', '2022-09-18', '2022-09-19']}
      defaultRangeValue={['2022-09-08', '2022-09-18']}
    ></Calendar>
  // </React.StrictMode>
)

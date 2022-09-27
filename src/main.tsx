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

let ranges = ['2022-08-21', '2022-09-18']


ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    // <App />
    <Calendar
      range
      // muti
      // canCancle
      // labelRender={(dayInfo: DayInfo) => { 
      //   return <div>1</div>
      // }}
      extraLabelRender={(dayInfo: DayInfo) => {
        if (dayInfo.type === 'current') {
          return <div className='dot' style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: dayInfo.show === '2022-08-10' ? '#FF8E22' : 'transparent',
            marginTop: '4px'
          }}></div>
        }
      }}
      onMonthChange={(month: string) => {
        console.log('%conMonthChange', 'padding: 1px; border-radius: 3px; color: #fff; background: red', month)
      }}
      onSelectRangeDone={(range: SelectRangeDoneType)=>{
        console.log('%conSelectRangeDone', 'padding: 1px; border-radius: 3px; color: #fff; background: red', range)
        ranges = range.map(item => {
          return item.show
        })
      }}
      onSelectDone={(selectDates: SelectDoneType)=>{
        console.log('%conSelectDone', 'padding: 1px; border-radius: 3px; color: #fff; background: red', selectDates)
      }}
      defaultValue={['2022-08-29','2022-08-30','2022-08-31']} // , '2022-09-18', '2022-10-19'
      defaultRangeValue={ranges}
      highLightDates={['2022-08-19','2022-08-10','2022-08-11']}
      // titleRender = {(month: any, props: any) => {
      //   let {
      //     nextMonthFn,
      //     lastMonthFn
      //   } = props

      //   return (
      //     <div style={{
      //       textAlign: 'center',
      //       padding: '20px',
      //       display: 'flex',
      //       justifyContent: 'space-between',
      //     }}>
      //       <div onClick={lastMonthFn}>last</div>
      //       <div>{month}</div>
      //       <div onClick={nextMonthFn}>next</div>
      //     </div>
      //   )
      // }}
      // beginText="开始日"
      // endText="结束日"
    ></Calendar>
  // </React.StrictMode>
)

import dayjs, {Dayjs} from 'dayjs'
import { throttle } from 'lodash'
import { useEffect, useRef, useState, useCallback } from 'react'
import './calendar.scss'

interface Props {

}

interface DayInfo {
  day: Dayjs
  show: string
  info?: any[]
  disabled?: boolean
  type: 'last' | 'current' | 'next',
  isToday?: boolean
  isSelect?: boolean
}

interface MonthTemp {
  [key: string]: Array<DayInfo[]>
}

type ChangeMonthType = 'NEXT'|'LAST'|null

let monthTemp: MonthTemp = {}
let today = dayjs().format('YYYY-MM-DD')


function genMonth(dayjs: Dayjs): Array<DayInfo[]> {
  // console.log(dayjs, monthTemp);

  if (monthTemp[dayjs.format('YYYY-MM')]) {
    return monthTemp[dayjs.format('YYYY-MM')]
  }

  let dayInfoArr:DayInfo[] = []

  let d = dayjs

  // 获取当前月份第一天/最后一天/当前月份天数
  let first = d.startOf('month')
  let last = d.endOf('month')
  let total = d.daysInMonth()

  // 当前月份第一天是星期几
  let firstDayWeekday = first.day()

  // 用上一个月补位
  for (let index = 0; index < firstDayWeekday; index++) {
    let day = first.subtract(index + 1, 'day')
    dayInfoArr.unshift({
      day,
      type: 'last',
      show: day.format('YYYY-MM-DD')
    })
  }

  for (let index = 0; index < total; index++) {
    let day = first.add(index, 'day')
    let str = day.format('YYYY-MM-DD')
    dayInfoArr.push({
      day,
      type: 'current',
      isToday: today === str,
      show: day.format('YYYY-MM-DD')
    })
  }

  // 判断还需要用下一个补位几日
  let l = dayInfoArr.length
  let remain = l % 7 > 0 ? 7 - l %7 : 0
  if (remain > 0) {
    for (let index = 0; index < remain; index++) {
      let day = last.add(index + 1, 'day')
      dayInfoArr.push({
        day,
        type: 'next',
        show: day.format('YYYY-MM-DD')
      })
    }
  }

  // 每7个放一组
  let temp = []

  for (let index = 0; index < dayInfoArr.length; index++) {
    const item = dayInfoArr[index];
    let i = Math.floor(index / 7)
    temp[i] ? temp[i].push(item) : (temp[i] = [item])
  }

  return temp
}

const Calendar: React.FC<Props> = function (props) {

  let [state,forceUpdate] = useState(0)

  let [currentDayjs, setCurrentDayjs] = useState(dayjs())

  let [monthList, setMonthList] = useState<Array<Array<DayInfo[]>>>([])
  // let monthList = useRef<Array<Array<DayInfo[]>>>([])


  let [startPos, setStartPos] = useState({x: 0, y: 0})
  let [endPos, setEndPos] = useState({x: 0, y: 0})
  let [transform, setTransform] = useState(0)

  let [width, setWidth] = useState<number>(0)

  let [animate, setAnimate] = useState(false)

  let [node, setNode] = useState<HTMLDivElement|null>(null)

  let changeMonthType = useRef<ChangeMonthType>(null)

  let monthContainerDom = useCallback((node: HTMLDivElement) => {
    if(node) {
      setNode(node)

      let w = node.getBoundingClientRect().width

      setWidth(w)

      setTransform(-w + endPos.x - startPos.x)
    }
  },[])

  let selectDateHandle = function (event: React.MouseEvent) {
    let el = event.target as HTMLElement
    let classList = el.classList

    // console.log(event.target, event.currentTarget);

    if(classList.contains('day-item')) {
      // console.log(el.dataset);
      if(classList.contains('selected')) {
        el.classList.remove('selected')
      } else {
        el.classList.add('selected')
      }
    }

  }

  let setCurrentMonthHandle = useCallback((dayjs: Dayjs, type: 'last' | 'next') => {
    // 先缓存月的数据
    monthTemp[dayjs.subtract(1, 'month').format('YYYY-MM')] = monthList[0]
    monthTemp[dayjs.format('YYYY-MM')] = monthList[1]
    monthTemp[dayjs.add(1, 'month').format('YYYY-MM')] = monthList[2]

    if(type === 'last') {
      setCurrentDayjs(dayjs.subtract(1, 'month'))
    } else {
      setCurrentDayjs(dayjs.add(1, 'month'))
    }
  }, [monthList])

  let dayItemHandle = useCallback((e: React.MouseEvent, item: DayInfo) => {
    item.isSelect = true
    forceUpdate(state + 1)
  },[state])

  let touchStartHandle = useCallback((e: React.TouchEvent) => {

    if(animate){
      return
    }


    let touch = e.touches[0]

    setAnimate(false)

    setStartPos({
      x: touch.clientX,
      y: touch.clientY
    })

    setEndPos({
      x: touch.clientX,
      y: touch.clientY
    })

  },[animate])

  let touchMoveHandle = useCallback(throttle((e: React.TouchEvent) => {

    if(animate){
      return
    }

    let touch = e.touches[0]

    setEndPos({
      x: touch.clientX,
      y: touch.clientY
    })

    setTransform(-width + touch.clientX - startPos.x)

  }),[width, startPos, animate])


  let touchEndHandle = useCallback((e: React.TouchEvent) => {

    if(animate){
      return
    }

    let direction = null

    if (endPos.x < startPos.x) {
      // 向左
      direction = 'LEFT'
    } else if (endPos.x > startPos.x){
      // 向右
      direction = 'RIGHT'
    }

    if(startPos.x !== endPos.x) {
      setAnimate(true)
    }

    if (Math.abs(startPos.x - endPos.x) >= width / 2) {
      // 如果移动距离大于 width/2 ，则切换月份
      if(direction === 'LEFT') {
        setTransform(-width * 2)
        changeMonthType.current = 'NEXT'
      } else if(direction === 'RIGHT'){
        setTransform(0)
        changeMonthType.current = 'LAST'
      }
    } else {
      // 如果小于 width/2 ，则停留在当前月
      setTransform(-width)
      changeMonthType.current = null
    }

    setStartPos({
      x: 0,
      y: 0
    })

    setEndPos({
      x: 0,
      y: 0
    })


  },[width, endPos, startPos, animate])

  let transionEndHandle = useCallback((e: React.TransitionEvent)=>{
    setAnimate(false)

    // 动画结束后切换月份,重置transform
    if(changeMonthType.current === 'NEXT') {
      setCurrentMonthHandle(currentDayjs, 'next')
    } else if(changeMonthType.current === 'LAST'){
      setCurrentMonthHandle(currentDayjs, 'last')
    }

    setTransform(-width)

  }, [width, currentDayjs, setCurrentMonthHandle]) // [width, currentDayjs, monthList]

  // 生成本月，前一个月，后一月的日历
  useEffect(()=>{
    let lastMonthDayjs = currentDayjs.subtract(1, 'month')
    let currentMonthDayjs = currentDayjs
    let nextMonthDayjs = currentDayjs.add(1, 'month')

    let lastMonth = genMonth(lastMonthDayjs)
    let currentMonth = genMonth(currentMonthDayjs)
    let nextMonth = genMonth(nextMonthDayjs)

    // console.log(currentDayjs.format('YYYY-MM'));
    // console.log(lastMonth)
    // console.log('currentMonth',currentMonth)
    // console.log(nextMonth)

    setMonthList([
      lastMonth,
      currentMonth,
      nextMonth
    ])

    // forceUpdate(state + 1)

  }, [currentDayjs])

  // useEffect(()=>{
  //   console.log('777',monthList);

  // }, [monthList])

  return <div className='calendar'>
            <div style={{marginBottom: '40px'}}>
              <div onClick={()=>{
                setCurrentMonthHandle(currentDayjs, 'last')
              }}>上个月</div>
              <div onClick={()=>{
                setCurrentMonthHandle(currentDayjs, 'next')
              }}>下个月</div>
            </div>
            <div
              className='month-container'
              ref={monthContainerDom}
              onTouchStart={touchStartHandle}
              onTouchMove={touchMoveHandle}
              onTouchEnd={touchEndHandle}
              onTransitionEnd={transionEndHandle}
              >
              <div className={'month-container-inner ' + `${animate ? 'animate' : ''}`} style={{
                transform: `translateX(${transform}px)`
              }}>
                {
                  monthList.map((monthItem, mIndex) => {
                    return <div className='month-item' key={'mouth-' + mIndex} onClick={(e)=>{
                      selectDateHandle(e)
                    }}>
                      <div style={{'textAlign': 'center'}}>{monthItem[1][0].day.format('YYYY-MM')}</div>
                      {
                        monthItem.map((weekItems, weekItemsIndex) => {
                          return <div className='row' key={'row-' + weekItemsIndex}>
                            {
                              weekItems.map(((dayItem, dayItemIndex)=> {
                                return <div
                                        onClick={(e)=>{
                                          e.stopPropagation()
                                          dayItemHandle(e, dayItem)
                                        }}
                                        data-ymd={dayItem.day.format('YYYY-MM-DD')}
                                        className={`day-item ${dayItem.type} ${dayItem.isToday ? 'today' : ''} ${dayItem.isSelect ? 'selected' : ''}`}
                                        key={`${dayItem.day.format('YYYY-MM-DD')}`}>
                                          <div className='day-show'>{dayItem.day.date()}</div>
                                        </div>
                              }))
                            }
                          </div>
                        })
                      }
                    </div>
                  })
                }
              </div>
            </div>
          </div>
}

export default Calendar

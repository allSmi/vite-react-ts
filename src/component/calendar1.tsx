import dayjs, {Dayjs} from 'dayjs'
import { find, throttle } from 'lodash-es'
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import './calendar.scss'
import  { observer } from 'mobx-react'
import React from 'react'
import classNames from 'classnames'
 
interface Props {
  labelRender?: Function
}

interface DayInfo {
  day: Dayjs
  show: string
  info?: any[]
  disabled?: boolean
  type: 'last' | 'current' | 'next',
  isToday?: boolean
  isSelect?: boolean
  label?: any
}

interface MonthTemp {
  [key: string]: Array<DayInfo[]>
}

type ChangeMonthType = 'NEXT'|'LAST'|null

function isSelected(dayItem: DayInfo, startDate: DayInfo | null, endDate: DayInfo | null) {
  if (dayItem.isSelect) return true

  if (startDate && endDate) {
    if (dayItem.type === 'current' && dayItem.show > startDate.show && dayItem.show < endDate.show) {
      return true
    }
  }
}

const Calendar: React.FC<Props> = observer(function (props) {

  const monthTemp = useRef<MonthTemp>({}) // 月份缓存，切换月份时先将当前月份缓存，下次直接从缓存中获取

  const [today, setToday] = useState(dayjs().format('YYYY-MM-DD')); // 记录今天的日期

  const [flag, setFlag] = useState(false); // 是否开启新一轮触摸时间的标记

  let [update,forceUpdate] = useState(0) // 强制重新渲染组件

  let [currentMonth, setCurrentMonth] = useState(dayjs('2018/08/08')) // 当前正在显示的日期，会计算当前日期所在的月份，初始值为今天，也可从外部传入

  let [monthList, setMonthList] = useState<Array<Array<DayInfo[]>>>([]) // 当前渲染的月份列表，目前为三个月份，[上个月，当前月，下个月]

  let [startPos, setStartPos] = useState({x: 0, y: 0}) // 左右滑动日历时，记录开始的位置
  let [endPos, setEndPos] = useState({x: 0, y: 0}) // 左右滑动日历时，记录结束的位置
  let [transform, setTransform] = useState(0) // 左右滑动日历时，实时计算touch的距离

  let [width, setWidth] = useState<number>(0) // 当前日历容器的宽度

  let [animate, setAnimate] = useState(false) // 是否开启动画，当touchEnd后，日历过渡到指定位置时，开启动画

  let [node, setNode] = useState<HTMLDivElement|null>(null)

  let changeMonthType = useRef<ChangeMonthType>(null) // touchEnd后，切换月份的类型 NEXT/LAST/null

  let selectDate1 = useRef<DayInfo | null>(null)
  let selectDate2 = useRef<DayInfo | null>(null)

  let startDate = useRef<DayInfo | null>(null)
  let endDate = useRef<DayInfo | null>(null)

  // 生成指定月份的日历
  const genMonth = (dayjs: Dayjs): Array<DayInfo[]> => {
    
    // 如果缓存里有要渲染的月份，直接从缓存中那，包含日期的各种状态
    if (monthTemp.current[dayjs.format('YYYY-MM')]) {
      return monthTemp.current[dayjs.format('YYYY-MM')]
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
    // 固定每月显示6行 * 7列 = 42 日
    let l = dayInfoArr.length
    let remain = 42 - l
  
    // 判断还需要用下一个补位几日
    // let l = dayInfoArr.length
    // let remain = l % 7 > 0 ? 7 - l %7 : 0
  
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

  // 计算容器宽度
  let monthContainerDom = useCallback((node: HTMLDivElement) => {
    if(node) {
      setNode(node)

      let w = node.getBoundingClientRect().width

      setWidth(w)

      setTransform(-w + endPos.x - startPos.x)
    }
  },[])

  // 设置当前展示的月份，currentDayjs变化后会触发重新计算monthList
  let toggleMonthHandle = useCallback((dayjs: Dayjs, type: 'last' | 'next', rangeType: 'month' | 'year' = 'month') => {
    // 先缓存月的数据
    monthTemp.current[dayjs.subtract(1, 'month').format('YYYY-MM')] = monthList[0]
    monthTemp.current[dayjs.format('YYYY-MM')] = monthList[1]
    monthTemp.current[dayjs.add(1, 'month').format('YYYY-MM')] = monthList[2]

    // 上一月/年 下一月/年
    if(type === 'last') {
      setCurrentMonth(dayjs.subtract(1, rangeType))
    } else {
      setCurrentMonth(dayjs.add(1, rangeType))
    }
  }, [monthList])

  // 选择日期回调函数
  let selectDayHandle = useCallback((e: React.MouseEvent, dayInfo: DayInfo) => {

    // 如果选中的是下个月的日期，切换到下个月, 选中下个月的日期
    if (dayInfo.type === 'last' || dayInfo.type === 'next') {

      toggleMonthHandle(currentMonth, dayInfo.type, 'month')
      
      let weekList = monthTemp.current[dayInfo.day.format('YYYY-MM')]

      let isFind = false // 是否找到指定日期

      // 选中下个月的日期
      for (let i = 0; i < weekList.length; i++) {
        const dayList = weekList[i];

        if (isFind) break

        for (let j = 0; j < dayList.length; j++) {
          const dayItem = dayList[j];
          if (dayItem.show === dayInfo.show) {

            dayItem.isSelect = true

            dayInfo = dayItem

            isFind = true

            break
          }
        }
      }
    }

    // 始终选中
    dayInfo.isSelect = true

    // 可以切换选中状态
    // dayInfo.isSelect = !dayInfo.isSelect
    

    if (!selectDate1.current) {
      selectDate1.current = dayInfo
    } else if (!selectDate2.current) {
      selectDate2.current = dayInfo
    } else {
      selectDate1.current.isSelect = false
      selectDate2.current.isSelect = false

      selectDate1.current = dayInfo
      dayInfo.isSelect = true

      selectDate2.current = null

      startDate.current = null
      endDate.current = null
    }

    // 判断选中日期大小，给开始时间和结束时间赋值
    if (selectDate1.current && selectDate2.current) {
      if (selectDate1.current.show <= selectDate2.current.show) {
        startDate.current = selectDate1.current
        endDate.current = selectDate2.current
      } else {
        startDate.current = selectDate2.current
        endDate.current = selectDate1.current
      }
    }

    forceUpdate(update + 1)

  },[update, toggleMonthHandle, currentMonth])

  // touchStart回调
  let touchStartHandle = useCallback((e: React.TouchEvent) => {
    if(animate) return

    setFlag(true)

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

  // touchMove回调
  let touchMoveHandle = useCallback(throttle((e: React.TouchEvent) => {

    if (animate) return

    if (!flag) return

    let touch = e.touches[0]

    setEndPos({
      x: touch.clientX,
      y: touch.clientY
    })

    setTransform(-width + touch.clientX - startPos.x)

  }),[width, startPos, animate])

  // touchEnd回调
  let touchEndHandle = useCallback((e: React.TouchEvent) => {
    if(animate) return

    if (!flag) return

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
    if (Math.abs(startPos.x - endPos.x) >= width / 6) {
      // 如果移动距离大于 width/6 ，则切换月份
      if(direction === 'LEFT') {
        setTransform(-width * 2)
        changeMonthType.current = 'NEXT'
      } else if(direction === 'RIGHT'){
        setTransform(0)
        changeMonthType.current = 'LAST'
      }
    } else {
      // 如果小于 width/6 ，则停留在当前月
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

    setFlag(false)

  },[width, endPos, startPos, animate])

  // 过渡结束回调
  let transionEndHandle = useCallback((e: React.TransitionEvent)=>{

    setTimeout(() => {
        // 动画结束后切换月份,重置transform
        if(changeMonthType.current === 'NEXT') {
          toggleMonthHandle(currentMonth, 'next', 'month')
        } else if(changeMonthType.current === 'LAST'){
          toggleMonthHandle(currentMonth, 'last', 'month')
        }
        setTransform(-width)
        setAnimate(false)

    }, 50);

  }, [width, currentMonth, toggleMonthHandle]) // [width, currentMonth, monthList]

  // 生成当前月，前一个月，后一月的日历
  useLayoutEffect(()=>{

    // console.log('%cmonthTemp', 'padding: 1px; border-radius: 3px; color: #fff; background: red', monthTemp.current)

    let lastMonthDayjs = currentMonth.subtract(1, 'month')
    let currentMonthDayjs = currentMonth
    let nextMonthDayjs = currentMonth.add(1, 'month')

    let lastMonthTemp = genMonth(lastMonthDayjs)
    let currentMonthTemp = genMonth(currentMonthDayjs)
    let nextMonthTemp = genMonth(nextMonthDayjs)

    // console.log(currentMonth.format('YYYY-MM'));
    // console.log(lastMonth)
    // console.log('currentMonth',currentMonth)
    // console.log(nextMonth)

    setMonthList([
      lastMonthTemp,
      currentMonthTemp,
      nextMonthTemp
    ])

  }, [currentMonth])

  return <div className='calendar'>
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

                    let key = monthItem[1][0].day.format('YYYY-MM')

                    return <div className='month-item' key={key}>
                      <div className='month-toggle' style={{'textAlign': 'center'}}>
                        <div className='month-toggle-last-year' onClick={()=>{
                          toggleMonthHandle(currentMonth, 'last', 'year')
                        }}>&lt;&lt;</div>
                        <div className='month-toggle-last-month' onClick={()=>{
                          toggleMonthHandle(currentMonth, 'last', 'month')
                        }}>
                          &lt;
                        </div>
                        <div className='current-month'>{monthItem[1][0].day.format('YYYY-MM')}</div>
                        <div className='month-toggle-next-month' onClick={()=>{
                          toggleMonthHandle(currentMonth, 'next', 'month')
                        }}>&gt;</div>
                        <div className='month-toggle-next-year' onClick={()=>{
                          toggleMonthHandle(currentMonth, 'next', 'year')
                        }}>&gt;&gt;</div>
                      </div>
                      {
                        monthItem.map((weekItems, weekItemsIndex) => {
                          return <div className='row' key={`${key}-row-${weekItemsIndex}`}>
                            {
                              weekItems.map(((dayItem, dayItemIndex)=> {
                                return <div
                                        onClick={(e)=>{
                                          e.stopPropagation()
                                          selectDayHandle(e, dayItem)
                                        }}
                                        data-ymd={dayItem.day.format('YYYY-MM-DD')}
                                        className={classNames(`day-item ${dayItem.type}`, {
                                          'today': dayItem.isToday,
                                          'selected': isSelected(dayItem, startDate.current, endDate.current)
                                        })}
                                        key={`${dayItem.day.format('YYYY-MM-DD')}`}>
                                          <div className='day-show'>{dayItem.day.date()}</div>
                                          <div className='day-label'>{dayItem?.label}</div>
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
})

export default Calendar

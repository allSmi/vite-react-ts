import dayjs, {Dayjs} from 'dayjs'
import { find, throttle } from 'lodash-es'
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import './calendar.scss'
import  { observer } from 'mobx-react'
import React from 'react'
import classNames from 'classnames'
 
interface Props {
  labelRender?: Function // label渲染函数
  onSelectDone?: Function // 没有设置 range 时 的选中回调
  onSelectRangeDone?: Function // 设置 range 时 的选中回调
  range?: boolean // 是否选中区间
  muti?: boolean // 是否可以多选，非 range 时生效
  canCancle?: boolean // 非 range 时生效，是否可以取消选中
  defaultValue?: Array<any> // 非 range 时生效，默认选中的日期
  defaultRangeValue?: Array<any> // range 时生效，默认选中的日期区间
  extraLabelRender?: Function
  beginText?: string // 开始日期的文案
  endText?: string // 结束日期的文案
  highLightDates?: Array<any> // 需要高亮的日期
  onMonthChange?: Function // 月份切换时的回调
}

export type SelectRangeDoneType = [DayInfo, DayInfo]

export type SelectDoneType = Array<DayInfo>

export interface DayInfo {
  day: Dayjs
  show: string
  info?: any[]
  disabled?: boolean
  type?: 'last' | 'current' | 'next',
  isToday?: boolean
  isSelect?: boolean
  label?: any
}

interface MonthTemp {
  [key: string]: Array<DayInfo[]>
}

type ChangeMonthType = 'NEXT'|'LAST'|null

const isBrowser = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

const touchSupported =
  isBrowser &&
  // @ts-ignore
  ('ontouchstart' in window || (window.DocumentTouch && document instanceof DocumentTouch));


const Calendar: React.FC<Props> = observer(function (props) {

  const { 
    labelRender, 
    range, 
    muti, 
    onSelectDone, 
    onSelectRangeDone, 
    canCancle, 
    defaultValue, 
    defaultRangeValue, 
    extraLabelRender, 
    beginText, 
    endText,
    highLightDates,
    onMonthChange
  } = props

  const monthTemp = useRef<MonthTemp>({}) // 月份缓存，切换月份时先将当前月份缓存，下次直接从缓存中获取

  const [today, setToday] = useState(dayjs().format('YYYY-MM-DD')); // 记录今天的日期

  const flag = useRef(false) // 是否开启新一轮触摸事件的标记

  let [update,forceUpdate] = useState(0) // 强制重新渲染组件

  let [currentMonth, setCurrentMonth] = useState(() => {
    if (range && defaultRangeValue?.length) {
      return dayjs(defaultRangeValue[0])
    }

    if (!range && defaultValue?.length) {
      return dayjs(defaultValue[0])
    }

    return dayjs()
  }) // useState(dayjs('2018/08/08')) // 当前正在显示的日期，会计算当前日期所在的月份，初始值为今天，也可从外部传入

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

  // 非 range 时的上一次选择
  let lastSelectDate = useRef<DayInfo | null>(null)
  // 非 range 时的日期选择集合
  let selectDates = useRef<Array<DayInfo>>([])

  useLayoutEffect(() => {
    selectDate1.current = range && defaultRangeValue?.[0] ? {
      show: defaultRangeValue[0],
      day: dayjs(defaultRangeValue[0])
    } : null

    selectDate2.current = range && defaultRangeValue?.[1] ? {
      show: defaultRangeValue[1],
      day: dayjs(defaultRangeValue[1])
    } : null

    startDate.current = range && defaultRangeValue?.[0] ? {
      show: defaultRangeValue[0],
      day: dayjs(defaultRangeValue[0])
    } : null

    endDate.current = range && defaultRangeValue?.[1] ? {
      show: defaultRangeValue[1],
      day: dayjs(defaultRangeValue[1])
    } : null

    if (!range) {
      if (defaultValue?.length) {
        if (muti) {
          selectDates.current = defaultValue.map((item: string) => {
            return {
              show: item,
              day: dayjs(item)
            }
          })
        } else {
          selectDates.current = [{
            show: defaultValue[0],
            day: dayjs(defaultValue[0])
          }]
        }
      }
    }

  }, [])

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

    function isSelectFn(show: string) {
      if (!range && selectDates.current) {
        for (let i = 0; i < selectDates.current.length; i++) {
          const date = selectDates.current[i];
          if (date.show === show) return true
        }
      }

      if (range && defaultRangeValue?.length === 2) {
        if (show === defaultRangeValue[0] && show === defaultRangeValue[1]) {
          return true
        }
      }

      return false
    }
  
    // 用上一个月补位
    for (let index = 0; index < firstDayWeekday; index++) {
      let day = first.subtract(index + 1, 'day')
      let show = day.format('YYYY-MM-DD')
      dayInfoArr.unshift({
        day,
        type: 'last',
        show,
      })
    }
    
    // 当前月份
    for (let index = 0; index < total; index++) {
      let day = first.add(index, 'day')
      let show = day.format('YYYY-MM-DD')

      let dayInfo = {
        day,
        type: 'current' as 'current',
        isToday: today === show,
        show,
        isSelect: isSelectFn(show)
      }

      if (!muti && !range && !lastSelectDate.current && show === defaultValue?.[0]) {
        lastSelectDate.current = dayInfo
      }

      dayInfoArr.push(dayInfo)
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

  let isSelected = useCallback((dayItem: DayInfo) => {
  
    if (dayItem.isSelect) return true
  
    // 开始日期和结束日期之间的日期也要选中（当前显示月份中的上/下个月的日期除外）
    if (range && startDate.current && endDate.current) {
      if (dayItem.type === 'current' && dayItem.show >= startDate.current.show && dayItem.show <= endDate.current.show) {
        return true
      }
    }
  }, [])

  let isStartDate = useCallback((dayItem: DayInfo) => {
    if (dayItem.type === 'current' && dayItem.show === startDate.current?.show) {
      return true
    }
  }, [])

  let isEndDate = useCallback((dayItem: DayInfo) => {
    if (dayItem.type === 'current' && dayItem.show === endDate.current?.show) {
      return true
    }
  }, [])

  let isRangeSelected = useCallback((dayItem: DayInfo) => {

    if (!range) {
      return false
    }

    if (dayItem.type === 'current') {

      if (dayItem.show === selectDate1.current?.show) {
        return true
      }

      if (dayItem.show === selectDate2.current?.show) {
        return true
      }

    }
  }, [])

  let isFirstDate = useCallback((dayItem: DayInfo) => {
    let firstDate = dayItem.day.startOf('month').format('YYYY-MM-DD')
    return dayItem.show === firstDate
  }, [])

  let isLastDate = useCallback((dayItem: DayInfo) => {
    let lastDate = dayItem.day.endOf('month').format('YYYY-MM-DD')
    return dayItem.show === lastDate
  }, [])

  let isHighLightDate = useCallback((dayItem: DayInfo) => {
    return highLightDates?.includes(dayItem.show)
  }, [])

  let _labelRender = useCallback((dayInfo: DayInfo) => {
    if (dayInfo.type === 'current') {
      if (startDate.current?.show === endDate.current?.show) {
        if (dayInfo.show === startDate.current?.show) {
          return <div className='label'>{ beginText ?? '开始'}/{ endText ?? '结束'}</div>
        }
      } else {
        if (dayInfo.show === startDate.current?.show) {
          return <div className='label'>{ beginText ?? '开始'}</div>
        }
        if (dayInfo.show === endDate.current?.show) {
          return <div className='label'>{ endText ?? '结束'}</div>
        }
      }

      if (dayInfo.isToday) return <div className='label'>今</div>
    }
    
    return null
  }, [])

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
  let toggleMonthHandle = useCallback((dayjs: Dayjs, type: 'last' | 'next', rangeType: 'month' | 'year' = 'month', e?: React.MouseEvent) => {

    // 先缓存月的数据
    monthTemp.current[dayjs.subtract(1, 'month').format('YYYY-MM')] = monthList[0]
    monthTemp.current[dayjs.format('YYYY-MM')] = monthList[1]
    monthTemp.current[dayjs.add(1, 'month').format('YYYY-MM')] = monthList[2]

    let currentMonthTemp = null
    // 上一月/年 下一月/年
    if(type === 'last') {
      currentMonthTemp = dayjs.subtract(1, rangeType)
    } else {
      currentMonthTemp = dayjs.add(1, rangeType)
    }

    setCurrentMonth(currentMonthTemp)

    onMonthChange?.(currentMonthTemp.format('YYYY-MM'))
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

            dayInfo = dayItem

            isFind = true

            break
          }
        }
      }
    }
    
    if (range) {

      dayInfo.isSelect = true

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

        onSelectRangeDone?.([startDate.current, endDate.current])
      }
    } else {
      // 非 range 
      if (canCancle) {

        if (dayInfo.isSelect) {
          // 取消选中
          let index = selectDates.current.findIndex(item => {
            return item.show === dayInfo.show
          })

          selectDates.current.splice(index, 1)
        } else {
          // 选中
          selectDates.current.push(dayInfo)
        }

        dayInfo.isSelect = !dayInfo.isSelect

      } else {
        // 不可以取消
        if (dayInfo.isSelect) {
          return
        }

        dayInfo.isSelect = true
        // 判断是否已经选中了
        let has = selectDates.current.some(item => {
          return item.show === dayInfo.show
        })
        if (!has) {
          selectDates.current.push(dayInfo)
        }
      }

      // 如果不能多选，先取消上次选中
      if (!muti) {
        if (lastSelectDate.current && lastSelectDate.current.show !== dayInfo.show) {
          lastSelectDate.current.isSelect = false
          lastSelectDate.current = dayInfo
          // console.log('%cmonthList', 'padding: 1px; border-radius: 3px; color: #fff; background: red', monthList)
        } else {
          // 缓存选择的日期
          lastSelectDate.current = dayInfo
        }

        if (dayInfo.isSelect) {
          selectDates.current = [dayInfo]
        }
      }

      onSelectDone?.(selectDates.current)
    }

    forceUpdate(update + 1)

  },[update, toggleMonthHandle, currentMonth])

  // touchStart回调
  let touchStartHandle = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    
    if(animate) return

    flag.current = true

    let touch = {
      clientX: 0,
      clientY: 0
    }

    if (touchSupported && e.type === "touchstart") {
      touch = (e as React.TouchEvent).touches[0]
      // console.log('%ctouch', 'padding: 1px; border-radius: 3px; color: #fff; background: red', touch)
    } else {
      touch = {
        clientX: (e as React.MouseEvent).clientX,
        clientY: (e as React.MouseEvent).clientY,
      }
    }

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
  let touchMoveHandle = useCallback(throttle((e: React.TouchEvent | React.MouseEvent) => {

    if (animate) return

    if (!flag.current) return

    let touch = {
      clientX: 0,
      clientY: 0
    }

    if (touchSupported) {
      touch = (e as React.TouchEvent).touches[0]
    } else {
      touch = {
        clientX: (e as React.MouseEvent).clientX,
        clientY: (e as React.MouseEvent).clientY,
      }
    }

    setEndPos({
      x: touch.clientX,
      y: touch.clientY
    })

    setTransform(-width + touch.clientX - startPos.x)

  }),[width, startPos, animate])

  // touchEnd回调
  let touchEndHandle = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if(animate) return

    if (!flag.current) return

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
    } else {
      flag.current = false
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

    

  },[width, endPos, startPos, animate])

  // 过渡结束回调
  let transionEndHandle = useCallback((e: React.TransitionEvent)=>{

    // setTimeout(() => {
        // 动画结束后切换月份,重置transform
        if(changeMonthType.current === 'NEXT') {
          toggleMonthHandle(currentMonth, 'next', 'month')
        } else if(changeMonthType.current === 'LAST'){
          toggleMonthHandle(currentMonth, 'last', 'month')
        }
        setTransform(-width)
        setAnimate(false)

        flag.current = false
    // }, 50);

  }, [width, currentMonth, toggleMonthHandle]) // [width, currentMonth, monthList]

  return (
    <div className='calendar'>
      <div className='month-toggle' style={{'textAlign': 'center'}}>
        <div className='month-toggle-last-year' onClick={(e)=>{
          toggleMonthHandle(currentMonth, 'last', 'year')
        }}>&lt;&lt;</div>
        <div className='month-toggle-last-month' onClick={(e)=>{
          toggleMonthHandle(currentMonth, 'last', 'month')
        }}>
          &lt;
        </div>
        <div className='current-month'>{currentMonth.format('YYYY-MM')}</div>
        <div className='month-toggle-next-month' onClick={(e)=>{
          toggleMonthHandle(currentMonth, 'next', 'month')
        }}>&gt;</div>
        <div className='month-toggle-next-year' onClick={(e)=>{
          toggleMonthHandle(currentMonth, 'next', 'year')
        }}>&gt;&gt;</div>
      </div>
      <div
        className='month-container'
        ref={monthContainerDom}
        onTouchStart={touchStartHandle}
        onTouchMove={touchMoveHandle}
        onTouchEnd={touchEndHandle}
        onTransitionEnd={transionEndHandle}
        onMouseDown={touchStartHandle}
        onMouseMove={touchMoveHandle}
        onMouseUp={touchEndHandle}
        onMouseLeave={touchEndHandle}
        >
        <div className={'month-container-inner ' + `${animate ? 'animate' : ''}`} style={{
          transform: `translateX(${transform}px)`
        }}>
          {
            monthList.map((monthItem, mIndex) => {

              let key = monthItem[1][0].day.format('YYYY-MM')

              return <div className='month-item' key={key}>
                {/* <div className='month-toggle' style={{'textAlign': 'center'}}>
                  <div className='month-toggle-last-year' onClick={(e)=>{
                    toggleMonthHandle(currentMonth, 'last', 'year')
                  }}>&lt;&lt;</div>
                  <div className='month-toggle-last-month' onClick={(e)=>{
                    toggleMonthHandle(currentMonth, 'last', 'month')
                  }}>
                    &lt;
                  </div>
                  <div className='current-month'>{monthItem[1][0].day.format('YYYY-MM')}</div>
                  <div className='month-toggle-next-month' onClick={(e)=>{
                    toggleMonthHandle(currentMonth, 'next', 'month')
                  }}>&gt;</div>
                  <div className='month-toggle-next-year' onClick={(e)=>{
                    toggleMonthHandle(currentMonth, 'next', 'year')
                  }}>&gt;&gt;</div>
                </div> */}
                <div className='week-show'>
                  <div className='week-show-item'>日</div>
                  <div className='week-show-item'>一</div>
                  <div className='week-show-item'>二</div>
                  <div className='week-show-item'>三</div>
                  <div className='week-show-item'>四</div>
                  <div className='week-show-item'>五</div>
                  <div className='week-show-item'>六</div>
                </div>
                {
                  monthItem.map((weekItems, weekItemsIndex) => {
                    return <div className='row' key={`${key}-row-${weekItemsIndex}`}>
                      {
                        weekItems.map(((dayItem, dayItemIndex)=> {
                          return <div
                                    // data-ymd={dayItem.day.format('YYYY-MM-DD')}
                                    className={classNames(`day-item-container ${dayItem.type}`, {
                                      'is-range': range,
                                      'is-today': dayItem.isToday,
                                      'is-selected': isSelected(dayItem),
                                      'is-start-date': isStartDate(dayItem),
                                      'is-end-date': isEndDate(dayItem),
                                      'is-range-selected': isRangeSelected(dayItem),
                                      'is-first-date': isFirstDate(dayItem),
                                      'is-last-date': isLastDate(dayItem),
                                      'is-high-light': isHighLightDate(dayItem)
                                    })}
                                    key={`${dayItem.day.format('YYYY-MM-DD')}`}>
                                      <div className={'day-item'} onClick={(e)=>{
                                        e.stopPropagation()

                                        if (flag.current) return

                                        selectDayHandle(e, dayItem)
                                      }}>
                                        <div className='day-show'>{dayItem.day.date()}</div>
                                        <div className='day-label'>{(labelRender || _labelRender)(dayItem)}</div>
                                      </div>
                                      <div className='day-extra-label'>{extraLabelRender?.(dayItem)}</div>
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
  )
})

export default Calendar

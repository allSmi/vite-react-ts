import { Component, ReactNode, useEffect, useRef, useState } from 'react'
import logo from './logo.svg'
import './App.css'

// interface Props {
//   a: number
// }
// interface State {
//   b: number
// }

// class App extends Component<Props, State> {

//   a = 11

//   state: Readonly<State> = {
//     b: 1
//   };

//   componentDidMount(){
//     setTimeout(() => {
//       this.a = 2

//       this.forceUpdate()
//       // this.setState({
//       //   b: 2
//       // })
//     }, 3000);
//   }

//   render(): ReactNode {

//       let {b} = this.state

//       return <div>{this.a}{b}</div>
//   }
// }

// const App: React.FC<Props> = function App(props) {

//   return <div>{props.a}</div>
// }

// App.defaultProps = {
//   a: 111
// }
let arr = new Array(5).fill('')

function App() {
  const [count, setCount] = useState(0)
  let refs = useRef(null)

  useEffect(()=>{
    console.log('---',refs.current);
  },[])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {
          arr.map((_, index)=>{
            return <p key={index} ref={refs}>Hello Vite + React!</p>
          })
        }
        <p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  )
}

export default App

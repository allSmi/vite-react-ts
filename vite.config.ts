import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import Inspect from 'vite-plugin-inspect'

// https://vitejs.dev/config/
// export default defineConfig({
//   // base: '/bbb/',
//   plugins: [
//     react(),
//     legacy()
//     // legacy({
//     //   targets: ['defaults', 'not IE 11']
//     // })
//   ],
// })

export default defineConfig(({command, mode})=>{
  console.log('command:',command);
  console.log('mode:', mode);


  return {
    // root: './root',
    // base: '/bbb/',
    define: {
      'process.env': {
        'FOO': 'aaa',
        'BAR': 111
      },
      '__DEV__': JSON.stringify(command)
      // '__DEV__': false
      // 'process.env.FOO': JSON.stringify('aaa'),
      // 'process.env.BAR': 111
    },
    plugins: [
      Inspect(),
      react(),
      legacy()
      // legacy({
      //   targets: ['defaults', 'not IE 11']
      // })
    ],
    resolve: {
      alias: {}
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `$injectedColor: orange; $aaa: red;`,
          // javascriptEnabled: true,
          // modifyVars: {
          //   "aaa": "red"
          // }
        }
      }
    },
    build: {
      sourcemap: true,
      // rollupOptions: {
      //   external: [
      //     'react',
      //     'react-dom',
      //   ]
      // },
      // minify: 'terser',
      // terserOptions: {
      //   compress: {
      //     drop_console: true
      //   }
      // }
    }
  }
})


// function asyncFn() {
//   return new Promise<any>((resolve,reject)=>{
//     setTimeout(() => {
//       resolve(null)
//     }, 5000);
//   })
// }

// export default defineConfig(async({command, mode})=>{
//   console.log('command:',command);
//   console.log('mode:', mode);
//   await asyncFn()

//   return {
//     // base: '/bbb/',
//     plugins: [
//       react(),
//       legacy()
//       // legacy({
//       //   targets: ['defaults', 'not IE 11']
//       // })
//     ],
//   }
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import Inspect from 'vite-plugin-inspect'
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs';
// import path from 'path'

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
        'BAR': 111,
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      },
      '__DEV__': JSON.stringify(command),
      // global: {} // 加上这个打包会报错
      // '__DEV__': false
      // 'process.env.FOO': JSON.stringify('aaa'),
      // 'process.env.BAR': 111
    },
    plugins: [
      Inspect(),
      react({
        babel: {
          presets: [
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: [
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
          ],
        },
      }),
      legacy(),
      viteCommonjs(),
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
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          // Solves:
          // https://github.com/vitejs/vite/issues/5308
          esbuildCommonjs(['react-flagpack'])
        ],
      },
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

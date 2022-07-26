import {terser} from 'rollup-plugin-terser';

export default {
    input: './index.js',
    output: [
        {
            file: './dist/index.js',
            format: 'es',
        },
        {
            file: './dist/index.min.js',
            format: 'es',
            plugins: [terser({
                compress: {
                    toplevel: true,
                    passes: 1, 
                    dead_code: true
                }
            })]
        }
    ]
}

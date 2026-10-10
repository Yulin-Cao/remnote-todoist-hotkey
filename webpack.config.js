const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: { index: './src/index.ts' },
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].js', clean: true },
  devServer: {
    host: '127.0.0.1',
    port: 8080,
    allowedHosts: 'all',
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  resolve: { extensions: ['.ts', '.tsx', '.js'] },
  module: {
    rules: [{ test: /\.tsx?$/, exclude: /node_modules/, loader: 'esbuild-loader', options: { loader: 'tsx', target: 'es2020' } }]
  },
  plugins: [
    new HtmlWebpackPlugin({ chunks: ['index'], filename: 'index.html', templateContent: '<!doctype html><html><body><div id="root"></div></body></html>' }),
    new CopyPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'README.md', to: 'README.md' },
      ],
    })
  ]
};

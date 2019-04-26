/*
	config for build umd module to use
* */
const path = require('path');
const base = require('./webpack.base');
const merge = require('webpack-merge');
const root = p => path.join(__dirname, '..', p);
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const argv = process.argv;
const showBundle = argv.includes('report');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(base, {
  mode: 'production',
  entry: root('src/package/main.js'),
  output: {
	path: path.resolve(__dirname, '../lib'),
	filename: 'imageUploader.js',
	publicPath: '/',
	library: 'ImageUploader',
	libraryTarget: 'umd',
	libraryExport: 'default', // 需要暴露的模块
	umdNamedDefine: true,
  },
  module: {
	rules: [
	  {
		test: /(\.less)$/,
		use: [
		  MiniCssExtractPlugin.loader,
		  {loader: 'css-loader'},
		  {loader: 'less-loader'},
		],
	  },
	],
  },
  performance: false,
  optimization: {
	minimize: true,
	minimizer: [
	  new UglifyJSPlugin({
		uglifyOptions: {
		  compress: {
			drop_console: true,
		  },
		},
	  }),
	],
  },
  plugins: [
	new MiniCssExtractPlugin({
	  filename: 'imageUploader.css',
	}),
	// new BundleAnalyzerPlugin(),
  ],
});

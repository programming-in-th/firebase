import * as admin from 'firebase-admin'
admin.initializeApp({
  storageBucket: 'proginth.appspot.com',
})
// No need to initialize with service account credentials

const function_name = process.env.FUNCTION_NAME || process.env.K_SERVICE

if (!function_name || function_name === 'makeSubmission') {
  exports.makeSubmission = require('./submissions/makeSubmission')
}

if (!function_name || function_name === 'getSubmission') {
  exports.getSubmission = require('./submissions/getSubmission')
}

if (!function_name || function_name === 'getSubmissions') {
  exports.getSubmissions = require('./submissions/getSubmissions')
}

if (!function_name || function_name === 'getUserContext') {
  exports.getUserContext = require('./users/getUserContext')
}

if (!function_name || function_name === 'onRegister') {
  exports.onRegister = require('./users/onRegister')
}

if (!function_name || function_name === 'setUsername') {
  exports.setUsername = require('./users/setUsername')
}

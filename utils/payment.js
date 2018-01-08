const { Iamporter, IamporterError } = require('iamporter');

// For Testing (테스트용 API KEY와 SECRET 기본 설정)
const iamporter = new Iamporter();

// For Production
const iamporter = new Iamporter({
  apiKey: 'YOUR_API_KEY',
  secret: 'YOUR_SECRET'
});
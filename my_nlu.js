//. my_nlu.js
var nluv1 = require( 'ibm-watson/natural-language-understanding/v1' );
var { IamAuthenticator } = require( 'ibm-watson/auth' );

var settings = require( './settings' );

exports.nlu = new nluv1({
  version: '2021-08-01',
  authenticator: new IamAuthenticator({
    apikey: settings.nlu_apiKey
  }),
  serviceUrl: settings.nlu_url
});


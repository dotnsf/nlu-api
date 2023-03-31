//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    nluv1 = require( 'ibm-watson/natural-language-understanding/v1' ),
    { IamAuthenticator } = require( 'ibm-watson/auth' ),
    //my = require( './my_nlu' ),
    app = express();

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
app.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

function getNlu( apikey, url ){
  var nlu = null;
  if( apikey && url ){
    nlu = new nluv1({
      version: '2021-08-01',
      authenticator: new IamAuthenticator({
        apikey: apikey
      }),
      serviceUrl: url
    });
  }

  return nlu;
};


app.post( '/api/create', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var apikey = req.body.apikey ? req.body.apikey : '';
  var url = req.body.url ? req.body.url : '';
  var nlu = getNlu( apikey, url );
  if( nlu ){
    var training_data = req.body.training_data ? req.body.training_data : '';
    if( training_data ){
      var language = req.body.language ? req.body.language : 'ja';
      var name = req.body.name ? req.body.name : 'nlu-api';

      var params = {
        language: language,
        trainingData: training_data,
        trainingDataContentType: 'text/csv',
        name: name,
        modelVersion: '1.0.0'
      };
      nlu.createClassificationsModel( params ).then( function( result ){
        res.write( JSON.stringify( result, null, 2 ) );
        res.end();
      }).catch( function( err ){
        console.log( { err } );
        res.status( 400 );
        res.write( JSON.stringify( err, null, 2 ) );
        res.end();
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: 400, statusText: 'no training_data(as csv).' }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: 400, statusText: 'no apikey and/or url.' }, null, 2 ) );
    res.end();
  }
});

app.post( '/api/status', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var apikey = req.body.apikey ? req.body.apikey : '';
  var url = req.body.url ? req.body.url : '';
  var nlu = getNlu( apikey, url );
  if( nlu ){
    nlu.listClassificationsModels().then( async function( result ){
      console.log( JSON.stringify( result, null, 2 ) );
      res.write( JSON.stringify( result, null, 2 ) );
      res.end();
    }).catch( function( err ){
      console.log( { err } );
      res.status( 400 );
      res.write( JSON.stringify( err, null, 2 ) );
      res.end();
    })
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: 400, statusText: 'no apikey and/or url.' }, null, 2 ) );
    res.end();
  }
});

app.post( '/api/analyze', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var apikey = req.body.apikey ? req.body.apikey : '';
  var url = req.body.url ? req.body.url : '';
  var nlu = getNlu( apikey, url );
  if( nlu ){
    var model_id = req.body.model_id ? req.body.model_id : '';
    var text = req.body.text ? req.body.text : '';
    if( model_id && text ){
      var language = req.body.language ? req.body.language : 'ja';
      var params = {
        text: text,
        language: language,
        features: { classifications: { model: '' } }
      };
      if( model_id ){
        var classifications = { model: model_id };
        var features = { classifications: classifications };
        params.features = features;
      }
      nlu.analyze( params ).then( function( result ){
        console.log( JSON.stringify( result, null, 2 ) );
        res.write( JSON.stringify( result, null, 2 ) );
        res.end();
      }).catch( function( err ){
        console.log( { err } );
        res.status( 400 );
        res.write( JSON.stringify( err, null, 2 ) );
        res.end();
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: 400, statusText: 'no model_id and/or text.' }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: 400, statusText: 'no apikey and/or url.' }, null, 2 ) );
    res.end();
  }
});

app.post( '/api/delete', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var apikey = req.body.apikey ? req.body.apikey : '';
  var url = req.body.url ? req.body.url : '';
  var nlu = getNlu( apikey, url );
  if( nlu ){
    var model_id = req.body.model_id ? req.body.model_id : '';
    if( model_id ){
      nlu.deleteClassificationsModel( { modelId: model_id } ).then( function( result ){
        console.log( JSON.stringify( result, null, 2 ) );
        res.write( JSON.stringify( result, null, 2 ) );
        res.end();
      }).catch( function( err ){
        console.log( { err } );
        res.status( 400 );
        res.write( JSON.stringify( err, null, 2 ) );
        res.end();
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: 400, statusText: 'no model_id.' }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: 400, statusText: 'no apikey and/or url.' }, null, 2 ) );
    res.end();
  }
});

app.get( '/', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  res.write( JSON.stringify( { status: 200, statusText: "OK" }, null, 2 ) );
  res.end();
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;

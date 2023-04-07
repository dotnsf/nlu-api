//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    nluv1 = require( 'ibm-watson/natural-language-understanding/v1' ),
    { IamAuthenticator } = require( 'ibm-watson/auth' ),
    axios = require( 'axios' ),
    { XMLParser } = require( 'fast-xml-parser' ),
    { Readable } = require( 'stream' ),
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

function getNLU( apikey, url ){
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

var parser = new XMLParser();
async function getCSVs(){
  return new Promise( ( resolve, reject ) => {
    var rss = {
      //. https://news.yahoo.co.jp/rss
      '経済': 'https://news.yahoo.co.jp/rss/categories/business.xml',
      'IT': 'https://news.yahoo.co.jp/rss/categories/it.xml',
      'エンタメ': 'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
      '科学': 'https://news.yahoo.co.jp/rss/categories/science.xml',
      '地域': 'https://news.yahoo.co.jp/rss/categories/local.xml',
      'スポーツ': 'https://news.yahoo.co.jp/rss/categories/sports.xml'
    };

    var cnt = 0;
    var lines = '';
    var keys = Object.keys( rss );
    keys.forEach( async function( category ){
      var url = rss[category];
      axios.get( url ).then( async function( result ){
        var xml = result.data;
        var obj = parser.parse( xml );
        if( obj && obj.rss && obj.rss.channel && obj.rss.channel.item && obj.rss.channel.item.length ){
          for( var i = 0; i < obj.rss.channel.item.length; i ++ ){
            var item = obj.rss.channel.item[i];
            var title = item.title.split( ',' ).join( '' ).split( '"' ).join( '' ).split( '\n' ).join( '' );
            var desc = item.description.split( ',' ).join( '' ).split( '"' ).join( '' ).split( '\n' ).join( '' );
            var line = title + ' ' + desc + ',' + category + '\n';
            lines += line;
          }
        }
        cnt ++;
        if( cnt == keys.length ){
          resolve( lines.trim() );
        }
      });
    });
  });
}


app.post( '/api/init', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var apikey = req.body.apikey ? req.body.apikey : '';
  var url = req.body.url ? req.body.url : '';
  var nlu = getNLU( apikey, url );
  if( nlu ){
    var training_data = await getCSVs();
    if( training_data ){
      var language = req.body.language ? req.body.language : 'ja';
      var name = req.body.name ? req.body.name : 'nlu-api';

      var params = {
        language: language,
        trainingData: Readable.from( training_data ),
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


app.post( '/api/create', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var apikey = req.body.apikey ? req.body.apikey : '';
  var url = req.body.url ? req.body.url : '';
  var nlu = getNLU( apikey, url );
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
  var nlu = getNLU( apikey, url );
  if( nlu ){
    nlu.listClassificationsModels().then( async function( result ){
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
  var nlu = getNLU( apikey, url );
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
  var nlu = getNLU( apikey, url );
  if( nlu ){
    var model_id = req.body.model_id ? req.body.model_id : '';
    if( model_id ){
      nlu.deleteClassificationsModel( { modelId: model_id } ).then( function( result ){
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

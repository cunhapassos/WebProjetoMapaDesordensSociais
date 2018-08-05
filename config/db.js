module.exports = {
  database:{
  	client: 'postgres',
  //version: '10.3',
  connection: {
    //host : '127.0.0.1' || 'localhost',
    //user : 'paulopassos',
    //password : '',
    database : process.env.DATABASE_URL
  }
  }
}
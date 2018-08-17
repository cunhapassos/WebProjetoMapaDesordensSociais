//CHAMANDO PACOTES
var express = require('express');
var bodyParser = require('body-parser');
var app = express(); //"app" criado para se usar o express
var pg = require('knex')({client: 'pg'});
var knexPostgis = require('knex-postgis');
var session = require('express-session');
var md5 = require('md5');
var consign = require('consign');
var methodOverride = require('method-override');
var io = require('socket.io')();
var http = require('http');
var expressSanitizer = require("express-sanitizer");

//ROTAS
var desordemRouter = require("./routes/desordem.js");
var orgaoRouter = require("./routes/orgaos.js");
var usuarioRouter = require("./routes/usuarios.js");
var tipoRouter = require("./routes/tipos.js");
var denunciaRouter = require("./routes/denuncias.js");
var gestorRouter = require("./routes/gestor.js");
var areaRouter = require("./routes/areas.js");

//ROTAS api
var ApidesordemRouter = require("./api/desordem.js");
var ApiorgaoRouter = require("./api/orgaos.js");
var ApiusuarioRouter = require("./api/usuarios.js");
var ApitipoRouter = require("./api/tipos.js");
var ApidenunciaRouter = require("./api/denuncias.js");
var ApigestorRouter = require("./api/gestor.js");

//CONFIGURAÇÕES GERAIS
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.engine('html', require('ejs').renderFile);
app.io = io;


const pgconf = require('pg')
pgconf.defaults.ssl = true

//DEFININDO SESSION
var sess;
app.use(session({
	secret : "shss",
	proxy: true,
    resave: true,
    saveUninitialized: true
}));

//CONEXÃO COM O BANCO
var knex = require('knex')({
  client: 'pg',
  connection: 'postgres://jwxsimyoqvdxew:5b045716d82e36a180af30cd8bbfd5ad6d2a3fecc2a6ae8db7f3e49f9242222c@ec2-54-221-210-97.compute-1.amazonaws.com:5432/d40ba6n3knjjq'

});

const st = knexPostgis(knex);


app.get("/", function(req,res){
	sess = req.session;
	
	res.redirect("admin");
	
});


app.get("/login", function(req,res){
	sess = req.session;

	if(!sess.email){
		res.render('login', {failed : 0});
	}
	else{
		res.redirect('admin');
	}

});

app.get("/logout", function(req,res){
	req.session.destroy(function(err) {
		if(err) {
		   console.log(err);
		 } else {
		   res.redirect('/');
		 }
   })
})

app.post("/login", function(req,res){
	sess = req.session;

	var senha = req.body.password;
	var email = req.body.email;
	
	console.log(email);
	// senha = md5(senha);

	var name = 0;

	knex('usuario').where({
		usu_email : email,
		usu_senha : senha
	}).select().then(function(usuario){
		if(usuario.length <= 0){
			res.render("login", {failed : 1});
		}
		else{
			sess = req.session;
			sess.email = email;
			sess.login = usuario[0].usu_login;
			sess.tipo = usuario[0].usu_tipo;
			sess.usuario_id = usuario[0].usu_idusuario;
			res.redirect("admin");
		}
	});
});


app.get("/admin", function(req,res){
	sess = req.session;
	
	var desordens_result;
	var polygons_result;
	
	knex.select().from("desordem").then(function(result){
		desordens_result = result;
	});
	
	knex.select('reg_regiao_alerta').from('regiao_alerta').then(function(result){
		polygons_result = result;
	})

	knex.raw('select ST_X(den_local_desordem),ST_Y(den_local_desordem), den_status, den_descricao, den_iddenuncia from denuncia').then(function(result){
		sess = req.session;
		res.render('admin', {pontos : result.rows, desordens : desordens_result, polygons : polygons_result, sess : sess, query : req.query});
	});


});

// GeoJSON Feature Collection
function FeatureCollection(){
    this.type = 'FeatureCollection';
    this.features = new Array();
}

app.use(denunciaRouter);
app.use(orgaoRouter);	
app.use(desordemRouter);
app.use(usuarioRouter);
app.use(tipoRouter);
app.use(gestorRouter);
app.use(areaRouter);

app.use(ApidenunciaRouter);
app.use(ApiorgaoRouter);	
app.use(ApidesordemRouter);
app.use(ApiusuarioRouter);
app.use(ApitipoRouter);
app.use(ApigestorRouter);

var server = http.createServer(app);
app.io.attach(server);

//inserido em 05/08/18 Paulo Passos
var port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log("server started");
})

io.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log("teste " + data.my);
	});
});
	   


// app.listen('3000', () => { //abrindo a aplicação na porta 3000
// 	console.log("Server started");
// });

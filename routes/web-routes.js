var express = require('express');
var router = express.Router();
var session = require('express-session');

var config = require("../config/db.js");
db = config.database;
var knex = require('knex')(db);


//DEFININDO SESSION
var sess;
router.use(session({
	secret : "shss",
	proxy: true,
    resave: true,
    saveUninitialized: true
}));



//ROTAS
var desordemRouter = require("./desordem.js");
var orgaoRouter = require("./orgaos.js");
var usuarioRouter = require("./usuarios.js");
var tipoRouter = require("./tipos.js");
var denunciaRouter = require("./denuncias.js");
var gestorRouter = require("./gestor.js");
var areaRouter = require("./areas.js");

router.get("/", function(req,res){
	sess = req.session;
	
	res.redirect("admin");
	
});


router.get("/login", function(req,res){
	sess = req.session;

	if(!sess.email){
		res.render('login', {failed : 0});
	}
	else{
		res.redirect('admin');
	}

});

router.get("/logout", function(req,res){
	req.session.destroy(function(err) {
		if(err) {
		   console.log(err);
		 } else {
		   res.redirect('/');
		 }
   })
})

router.post("/login", function(req,res){
	sess = req.session;

	var senha = req.body.password;
	var email = req.body.email;
	
	console.log(email);
	//senha = md5(senha);

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


router.get("/admin", function(req,res){
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

router.use(denunciaRouter);
router.use(orgaoRouter);	
router.use(desordemRouter);
router.use(usuarioRouter);
router.use(tipoRouter);
router.use(gestorRouter);
router.use(areaRouter);

module.exports = router;
var express = require('express');
var config = require("../config/db.js");
var router = express.Router({mergeParams : true});
db = config.database;

var knex = require('knex')(db);

router.get("/denuncias/:id/show", function(req, res){
    sess = req.session;

    if(sess.email){

        knex.raw('select ST_X(den_local_desordem),ST_Y(den_local_desordem), den_status, den_descricao, den_iddenuncia, den_iddesordem, den_idusuario,den_datahora_registro, den_datahora_ocorreu, den_datahora_solucao, den_status, den_nivel_confiabilidade, den_descricao, den_anonimato, usu_nome, des_descricao from denuncia inner join usuario on usu_idusuario = den_idusuario inner join desordem on des_iddesordem = den_iddesordem where den_iddenuncia = ' + req.params.id).then(function(result){

            if(result.rows[0].den_datahora_registro){
                registro = formatDate(result.rows[0].den_datahora_registro);
            }else{
                registro = result.rows[0].den_datahora_registro;
            }

            if(result.rows[0].den_datahora_ocorreu){
                ocorreu = formatDate(result.rows[0].den_datahora_ocorreu);
            }else{
                ocorreu = result.rows[0].den_datahora_ocorreu;
            }

            if(result.rows[0].den_datahora_solucao){
                solucao = formatDate(result.rows[0].den_datahora_solucao);
            }else{
                solucao = result.rows[0].den_datahora_solucao;
            }
            
            res.render("denuncia/show", {denuncia : result.rows[0], registro : registro, ocorreu : ocorreu, solucao : solucao});
        
        });
    }else{
        res.redirect("../../login");
    }
    
})

router.get("/denuncias", function(req, res){
    sess = req.session;

    if(sess.email){
        knex.select().from("denuncia").then(function(result){
            knex.select().from("tipo_desordem").then(function(tipos){
                knex.select().from("desordem").then(function(desordens){
                    // console.log("Desordens " + desordens[2].des_iddesordem);
                    res.render("denuncia/index", {denuncias : result, filtro : req.query, tipos : tipos, desordens : desordens});            
                })
            })
        })
    }else{
        res.redirect("login");
    }
});

router.post("/denuncias/denuncia-status", function(req,res){
    sess = req.session;

    if(sess.email){
        knex('denuncia')
            .where('den_iddenuncia', '=', req.body.denunciaid)
            .update({
            den_status: req.body.status
        }).then(function(){
            res.redirect("/denuncias/" + req.body.denunciaid +"/show");
        })
    }else{
        res.json({
            error : "Sem permissão para alterar mudança" 
        })
    }
})

router.post("/denuncias/delete", function(req,res){
    sess = req.session

    knex('denuncia')
	.where('den_iddenuncia', req.body.id_denuncia)
	.del().then(function(){
		res.redirect("/denuncias");
	})
})

router.post("/denuncias", function(req, res){
        
    sess =req.session;

    datahoraregistro = new Date();

    var dataocorreu = req.body.dataocorreu;
    dataocorreu = dataocorreu.replace(/\//g, "-");

    datahoraocorreu = dataocorreu + " " + req.body.horaocorreu;
   
    //var datasolucao = req.body.datasolucao;
    //datasolucao = datasolucao.replace(/\//g, "-");

    //datahorasolucao = datasolucao + " " + req.body.horasolucao;

    var desordem = req.body.desordem;
    desordem = parseInt(desordem);
	var status = "Pendente";
	var confiabilidade = 1;
	var descricao = req.body.descricao;
    var anonimato = req.body.anonimato;
    
    console.log("LATITUDE E LONGITUDE   " + req.body.latitude + " " + req.body.longitude);

    knex('denuncia').insert({
        den_iddesordem : desordem,
        den_idusuario : sess.usuario_id,
        den_datahora_registro : datahoraregistro,
        den_datahora_ocorreu : datahoraocorreu,
        den_status : status,
        den_nivel_confiabilidade : confiabilidade,
        den_local_desordem : "POINT(" + req.body.latitude + " " + req.body.longitude +")",
        den_descricao : descricao,
        den_anonimato : anonimato
	}).then(function(){
		res.redirect("../admin");
	}).catch(function(error){
		console.log(error);
		res.redirect("admin");
    });
    
    
})

router.post("/app/tipodedesordem", function(req, res){


    knex.select().from("desordem").orderBy("des_descricao").then(function(tipos){
                
        res.send(tipos);            
    })

});

router.post("/app/inserir/tipodedesordem", function(req, res){

    var tipo = req.body.tipo;
    var orgao = req.body.orgao;
    var descricao = req.body.descricao;

    console.log(tipo);
    console.log(orgao);
    console.log(descricao);

    knex('desordem').insert({
        des_tipo: tipo,
        des_descricao: descricao,
        org_idorgao: orgao
    }).then(function(){
        res.send({sucesso: 'true'});
    }).catch(function(error){
        res.send({sucesso: 'ERRO'});
    });
});

router.post("/app/denuncia/inserir", function(req, res){
  
    var usuario = req.body.usuario;
    var status = req.body.den_status;
    var descricao = req.body.den_descricao;
    var anonimato = req.body.den_anonimato;
    var descricaoDesordem = req.body.desordem;
    var datahoraregistro = req.body.den_datahora_registro;
    var datahoraocorreu = req.body.den_datahora_ocorreu;
    var confiabilidade = req.body.den_nivel_confiabilidade;

    knex('desordem').where({des_descricao : descricaoDesordem}).select().then(function(found){
        var iddesordem = found[0].des_iddesordem;
        knex('usuario').where({usu_email : usuario}).select().then(function(usuario){
            var idusuario = usuario[0].usu_idusuario;
            knex('denuncia').insert({
                den_iddesordem : iddesordem,
                den_idusuario : idusuario,
                den_datahora_registro : datahoraregistro,
                den_datahora_ocorreu : datahoraocorreu,
                den_status : status,
                den_nivel_confiabilidade : confiabilidade,
                den_local_desordem : "POINT(" + req.body.den_local_latitude + " " + req.body.den_local_longitude +")",
                den_descricao : descricao,
                den_anonimato : anonimato
            }).then(function(){
                res.send({sucesso: 'true'});
            }).catch(function(error){
                res.send({sucesso: error});
            });
        });
    });
});

function formatDate(date){

    hora = date.getHours();
    minutos = date.getMinutes();
    segundos = date.getSeconds();

    if(hora <= 9){
        hora = "0" + hora;
    }

    if(minutos <= 9){
        minutos = "0" + minutos;
    }

    if(segundos <= 9){
        segundos = "0" + segundos;
    }

    horario = hora + ":" + minutos + ":" + segundos;

    date = date.toLocaleDateString();
			
	ano = date.substr(0, 4);
	mes = date.substr(5,1);
    dia = date.substr(7,2);
    
    if(dia <= 9){
        dia = "0" + dia;
    }
    
    if(date.substr(6,1) != '-'){
        mes = date.substr(5,2);
        dia = date.substr(8,2);
    }
	
	if (mes <= 9){
		mes = "0" + mes;
    }

	date = (dia + "/" + mes + "/" + ano);


    if(horario != "00:00:00"){
        date = date + ", Hora: " + horario;
    }

	return date;
}

module.exports = router;
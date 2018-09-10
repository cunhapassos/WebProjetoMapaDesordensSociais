var express = require('express');
var config = require("../config/db.js");
var router = express.Router({mergeParams : true});
db = config.database;

var knex = require('knex')(db);

router.post("/areas/create", function(req,res){
    sess =req.session;
    var points = String(req.body.data);
    points = points.replace(/\[/g, "(");
    points = points.replace(/\]/g, ")");

    if(sess.email){

        knex('regiao_alerta').insert({
            usu_idusuario : sess.usuario_id,
            reg_regiao_alerta : points
        }).then(function(){
            res.redirect("../admin");
        }).catch(function(error){
            console.log(error);
            res.status(500).send('Something broke!');
        });
    }else{
        res.status(500).send('Você não tem permissão para inserir regiões de alerta');
    }
})

module.exports = router;
var thrift = require("thrift")
var util = require("util");
var mysql = require("mysql-native")

var DBService = require("./thrift/IKaoDBIFace")
var ShareStruct_ttypes = require("./thrift/ShareStruct_Types")
var ErrorNo_ttypes = require("./thrift/ErrorNo_Types")
var Exception_ttypes = require("./thrift/Exception_Types")

var poolModule = require('generic-pool');
var mysqlPool = poolModule.Pool({
    name     : 'mysql',
    create   : function(callback) {
        var client = mysql.createTCPClient(process.conf.mysql.ip,process.conf.mysql.port);
        client.auth(process.conf.mysql.u,process.conf.mysql.p,process.conf.mysql.db)
        callback(null, client);
    },
    destroy  : function(client) { client.close() }, //当超时则释放连接
    max      : 10,   //最大连接数
    idleTimeoutMillis : 10,  //超时时间
    log : true
});

var FALSE = -1
var TRUE = 1

var server = exports.db = thrift.createServer(DBService,{
    getForTL:function(uid,g,start,len,response){
        mysqlPool.borrow(function(err,mysql){
            var mids = []
            mysql.execute("select mid from timeline where uid=? and type=? order by ctime limit ?,?",[uid,g,start,len]).on('row',
                function(r) { mids.push(r.mid) }
            ).on("end",function(){
                 mysqlPool.release(mysql)
                 response(new ShareStruct_ttypes.TimeLine( {"uid":uid,"group":g,"mids":mids}))
            });
        })
    },

    addForTL:function(uid,types,mid,response){
        mysqlPool.borrow(function(err,mysql){
            ic = 0
            types.forEach(function(ele){
                mysql.execute("insert into timeline (mid,uid,type) values (?,?,?)",[mid,uid,ele]).on("end",function(){
                    ic ++;
                    if(ic==types.length){
                        mysqlPool.release(mysql)
                        response(TRUE)
                    }
                })
            })
        })
    },
    removeForTL:function(uid,mid,g,response){
        mysqlPool.borrow(function(err,mysql){
            mysql.execute("delete timeline where uid=? and mid=? and type=?",[uid,mid,g]).on("end",function(){
                mysqlPool.release(mysql)
                response(TRUE)
            })
        })
    },

    getMsgCounter:function(mids,response){
        mysqlPool.borrow(function(err,mysql){
            var ret =[]
            var sql = "select mid,count from msgcounter where mid in (";
            mids.forEach(function(ele){
                sql = sql + ele +","
            })
            sql = sql.substr(0,sql.length-1)
            sql = sql + ")"
            mysql.execute(sql,mids).on("row",function(r){
               ret[r.mid]= r.count}
            ).on("end",
            function(){
                mysqlPool.release(mysql)
                response(ret)
            }
            )
        })
    },

    getRelatedMsg:function(mid,start,len,response){
        mysqlPool.borrow(function(err,mysql){
            var ret = [];
            mysql.execute("select rmid from msgrelation where mid=? order by ctime limit ?,?",[mid,start,len]).on("row",function(r){
                ret.push(r.rmid)
            }).on("end",function(){
                mysqlPool.release(mysql)
                response(ret)
            })
        })
    },

    addRelatedMsg:function(mid,answer,response){
        mysqlPool.borrow(function(err,mysql){
            mysql.execute("insert into msgrelation (mid,answer) values (?,?)",[mid,answer]).on("end",function(){
                mysqlPool.release(mysql)
                response(TRUE)
            })
        })
    },

    deleteRelatedMsg:function(mid,answer,response){
        mysqlPool.borrow(function(err,mysql){
            mysql.execute("insert into msgrelation (mid,answer) values (?,?)",[mid,answer]).on("end",function(){
                mysqlPool.release(mysql)
                response(TRUE)
            })
        })
    },

    addFollow:function(uid,followId,type,response){
        mysqlPool.borrow(function(err,mysql){
           mysql.execute("insert into follow (uid,followid,type) values (?,?,?)",[uid,followId,type]).on("end",function(){
               mysqlPool.release(mysql)
               response(TRUE)
           })
        })
    },

    cancelFollow:function(uid,followId,type,response){
        mysqlPool.borrow(function(err,mysql){
            mysql.execute("delete follow where uid=? and followid=? and type=?",[uid,followId,type]).on("end",function(){
                mysqlPool.release(mysql)
                response(TRUE)
            })
        })
    },

    cancelFans:function(uid,fansId,type,response){
        mysqlPool.borrow(function(err,mysql){
            mysql.execute("delete fans where uid=? and fansid=? and type=?",[uid,fansId,type]).on("end",function(){
                mysqlPool.release(mysql)
                response(TRUE)
            })
        })
    },

    addFans:function(uid,fansId,type,response){
        mysqlPool.borrow(function(err,mysql){
            mysql.execute("insert into fans (uid,fansid,type) values (?,?,?)",[uid,fansId,type]).on("end",function(){
                mysqlPool.release(mysql)
                response(TRUE)
            })
        })
    },

    getFollow:function(uid,start,len,type){
        mysqlPool.borrow(function(err,mysql){
            var ret= [];
            mysql.execute("select followid from follow where uid=? and type=? order by ctime limit ?,?",[uid,type,start,len])
            .on("row",function(r){
                    ret.push(r.followid)
                })
            .on("end",function(){
                mysqlPool.release(mysql)
                response(ret)
            })
        })
    },

    getFans:function(uid,start,len,type){
        mysqlPool.borrow(function(err,mysql){
            var ret= [];
            mysql.execute("select fansid from fans where uid=? and type=? order by ctime limit ?,?",[uid,type,start,len])
                .on("row",function(r){
                    ret.push(r.fansid)
                })
                .on("end",function(){
                    mysqlPool.release(mysql)
                    response(ret)
                })
        })
    },

    postMsg:function(msg,response){
        mysqlPool.borrow(function(err,mysql){
            i1 = false;
            i2 = false;
            i3 = false;
            mysql.execute("insert into post (mid,uid,type,grade,ip,device,msgtext,msgdesc) values (?,?,?,?,?,?,?,?)"
            ,[msg.mid,msg.uid,msg.type,msg.category,msg.ip,msg.device,msg.msgtext,msg.msgdesc]).on("end",function(){
                    i1 = true
                    if(i1 && i2 && i3){
                        mysqlPool.release(mysql)
                        response(TRUE);
                    }
            })
            msg.tags.forEach(function(ele){
                var ct = 0;
                mysql.execute("insert into posttag (mid,tag) values (?,?)",[msg,mid,ele]).on("end",function(){
                   ct ++;
                   if(ct == msg.tags.length){
                        i2 = true
                   }
                    if(i1 && i2 && i3){
                        mysqlPool.release(mysql)
                        response(TRUE);
                    }
                })
            })
            msg.attachments.forEach(function(ele){
                var ct = 0;
                mysql.execute("insert into postattach (mid,type,attachtext,attachname) values (?,?,?,?)",[msg.mid,
                    ele.type,ele.attachtext,ele.attachname]).on("end",function(){
                        ct ++;
                        if(ct == msg.attachments.length){
                            i3 = true
                        }
                        if(i1 && i2 && i3){
                            mysqlPool.release(mysql)
                            response(TRUE);
                        }
                    })
            })
        })
    }

})



ik = 0
setInterval(function(){
    if(ik!=0) return
    ik++
    var mysql = require("mysql-native")

    var client = mysql.createTCPClient("127.0.0.1",3306);
    client.auth("ikao","ikao","ikao")
    console.log("xxx")
    client.execute("select mid,count from msgcounter where mid in (123,234)").on("row",function(r){
        console.log("r")
    }).on("end",
        function(){
            console.log("end")
        }
    )
},500)

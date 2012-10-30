var thrift = require("thrift")
var util = require("util");
var mysql = require("mysql-native")

var DBService = require("./thrift/IKaoDBIFace")
var ShareStruct_ttypes = require("./thrift/ShareStruct_Types")
var ErrorNo_ttypes = require("./thrift/ErrorNo_Types")
var Exception_ttypes = require("./thrift/Exception_Types")

var connection = thrift.createConnection('localhost', 8090),
client = thrift.createClient(DBService, connection);

client.getMsgCounter(["123","234"],function(err,reply){
    console.log(reply)
})

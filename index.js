var express = require("express");
var app = express();
var mongo = require("mongodb").MongoClient;
var url = require("url");
var user = "kenneth";
var pass = "kenneth";
var dblink = "mongodb://" + user + ":" + pass + "@ds141490.mlab.com:41490/url-shortener";
app.use(express.static(__dirname + "/view"));
app.use(express.static(__dirname + "/new"));
app.get("/", function(req, res) {
	res.sendFile("index.html");
});
app.get("/new/*", function(req, res) {
	var link = url.parse(req.path.replace("\/new\/", ""));
	if(link.protocol && link.host) {
		var labelStrings = link.host.split(/\.+/g).filter(n => true);
		var lbl = labelStrings.length;
		if(lbl>1 && lbl<4 && labelStrings[0].match(/^[a-z0-9]/) && labelStrings[lbl-1].match(/^[a-z]/)) {
			var path = link.href.replace(link.protocol + "//" + link.host, "");
			if(path.split(/\./g).length <= 2) {
				makeUrl(link.href, res);
			} else {
				res.send({err: "Invalid path."});
			}
		} else {
			res.send({err: "Invalid hostname."});
		}
	} else {
		res.send({err: "Make sure you follow the right format. \"/new/<protocol>//<host>\""});
	}
});
function makeUrl(orig, res) {
	var link;
	mongo.connect(dblink, function(err, db) {
		if(err) throw err;
		var urlList = db.collection("url_list");
		urlList.find({original_url: orig},{_id: 0, original_url:1, short_url: 1}).toArray(function(err, docs) {
			link = docs[0];
			if(link != null) {
				console.log("-- Found --");
				console.log(link);
				res.send(link);
				db.close();
			} else {
				link = {
					original_url: orig,
					short_url: "https://url-shortener-klm.herokuapp.com/" + (new Date().getTime()/1000).toFixed(0)
				};
				urlList.insert(link, function(err, data) {
					if(err) throw err;
					console.log("-- Inserted --");
					console.log(link);
					delete link["_id"];
					res.send(link);
					db.close();
				});
			}
		});
	});
}
app.get("/*", function(req, res) {
	mongo.connect(dblink, function(err, db) {
		if(err) throw err;
		var urlList = db.collection("url_list");
		var short = req.path.replace("/", "https://url-shortener-klm.herokuapp.com/");
		console.log("short " + short);
		urlList.find({short_url: short}).toArray(function(err, docs) {
			if(err) throw err;
			var link = docs[0];
			console.log("--- link ---");
			console.log(link);
			if(link != null) {
				console.log("-- Found --");
				console.log(link);
				//window.location.href = url.parse(link.original_url);
				res.send(url.parse(link.original_url));
				db.close();
			} else {
				res.send({err: "short_url not found."});
				db.close();
			}
		});
	});
});
app.listen(process.env.PORT || 3000);
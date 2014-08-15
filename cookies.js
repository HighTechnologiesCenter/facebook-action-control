/********************/
// Cookies Script //
/********************/
var Cookies = {
	started:false,
	values:{},
	create:function (name,value,days,domain) {
		if (days) {
			var date= new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = date.toGMTString();
		}else {
			var date= new Date();
			date.setTime(date.getTime()+(365*24*60*60*1000));//default to 1 year
			var expires = date.toGMTString();
		}
		document.cookie = name + "=" + escape(value) + "; expires=" + expires + ";path=/" + ((domain) ? "; domain=" + domain : "");
	},

	init:function () {
		var allCookies = document.cookie.split ('; ');
		for (var i=0;i<allCookies.length;i++) {
			var cookiesPair = allCookies[i].split('=');
			this.values[cookiesPair[0]] = unescape(cookiesPair[1]);
		}
		this.started=true;
	},

	read:function(name) {
		return this.values[name];
	},

	erase:function(name,domain) {
		this.create(name,"",-1,domain);
		this.values[name]=null;
	}
}
Cookies.init();

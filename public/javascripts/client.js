$(function(){
	var socket = io.connect('http://192.168.28.62:3000');
	
	socket.on('response', function (res) {

		var identifier = res.identifier;
		delete(res.identifier);


		var html = '';
		if (typeof(res['Body']) == 'string'){
			try {
				var body = JSON.parse(res['Body']);
				res['Body'] = body;
			}
			catch(e){}
		}

		
		for (i in res){
			if (typeof(res[i]) == 'object' && res[i].length != 0){
				res[i] = JSON.stringify(res[i], null, '  ')
			}
			html += '<h5>'+i+'</h5><div>'+res[i]+'</div>';
		}
		$('<div class="response"><h3><span class="highlight">' + res.StatusCode + '</span> Response</h3>' + html + '</div>').hide().prependTo('#open-' + identifier).fadeIn();	
		$('#loader-' + identifier).replaceWith('<i class="icon-ok"></i>');
	});
	
	socket.on('request', function (req) {
		var identifier = req.identifier;
		delete(req.identifier);

		var html = '';
		for (i in req){
			if (typeof(req[i]) == 'object'){
				req[i] = JSON.stringify(req[i], null, '  ')
			}
			html += '<h5>'+i+'</h5><div>'+req[i]+'</div>';
		}
		$('<div class="wrap" data-identifier="' + identifier + '"><a class="opener btn" data-toggle="collapse" data-target="#open-' + identifier + '"><img src="/images/ajax-loader.gif" id="loader-' + identifier + '"> <strong>Request #' + $('#list .wrap').length + '</strong> <span class="highlight">' + req.Method + '</span> ' + req.Url + '</a><div  id="open-' + identifier + '" class="expand collapse"><div class="request"><h3><span class="highlight">' + req.Method + '</span> Request</h3>' + html + '</div></div></div>').hide().prependTo('#list').fadeIn()
	});
});
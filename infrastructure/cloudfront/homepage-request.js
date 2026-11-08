// CloudFront Function, viewer-request. Deploy only on a distribution in front of Amplify.
function handler(event) {
	var request = event.request
	if (request.uri !== '/' || (request.method !== 'GET' && request.method !== 'HEAD')) {
		return request
	}
	var accept = request.headers.accept ? request.headers.accept.value : ''
	// Generic */* and absent Accept stay HTML. Respect explicitly disabled media types.
	var markdown = 0
	var html = 0
	accept.split(',').forEach(function (entry) {
		var parts = entry.trim().toLowerCase().split(';')
		var type = parts[0].trim()
		var q = 1
		parts.slice(1).forEach(function (parameter) {
			var match = /^\s*q\s*=\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*$/.exec(parameter)
			if (match) q = Number(match[1])
		})
		if (type === 'text/markdown') markdown = Math.max(markdown, q)
		if (type === 'text/html') html = Math.max(html, q)
	})
	if (markdown > 0 && markdown > html) {
		// Different URI means a separate CloudFront cache entry from the HTML homepage.
		request.uri = '/index.md'
	}
	return request
}

// CloudFront Function, viewer-response. Origin security headers are left untouched.
function handler(event) {
	var request = event.request
	var response = event.response
	if (request.uri !== '/' && request.uri !== '/index.md') return response
	if (request.uri === '/index.md' && response.statusCode === 200) {
		response.headers['content-type'] = { value: 'text/markdown; charset=utf-8' }
	}
	var vary = response.headers.vary ? response.headers.vary.value : ''
	if (!/(?:^|,)\s*Accept\s*(?:,|$)/i.test(vary)) {
		response.headers.vary = { value: vary ? vary + ', Accept' : 'Accept' }
	}
	return response
}

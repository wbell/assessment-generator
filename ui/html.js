module.exports = function HTMLBuilder(title, style, script){

	return  '<!DOCTYPE html>' +
			'<html lang="en" ng-app="AssessmentGenerator">' +
			'<head>' +
				'<meta charset="UTF-8">' +
				'<title>'+title+'</title>' +
				'<style>'+style+'</style>' +
			'</head>' +
			'<body>' +
				'<div ui-view></div>' +
				'<script>'+script+'</script>' +
			'</body>' +
			'</html>';

};
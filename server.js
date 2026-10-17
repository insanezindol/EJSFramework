const path = require('node:path');
const express = require('express');
const session = require('express-session');
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
	secret: '@#@$MYSIGN#@$#$',
	resave: false,
	saveUninitialized: true
}));

require('./router/main')(app);

// user.json 읽기/쓰기, JSON 파싱 실패 등은 서버를 죽이지 않고 500으로 응답
// (잘못된 요청 바디 같은 4xx는 Express 기본 핸들러에 맡긴다)
app.use((err, req, res, next) => {
	const status = err.status || err.statusCode || 500;
	if (status < 500 || res.headersSent) {
		next(err);
		return;
	}
	console.error(err);
	res.status(500).json({ success: 0, error: 'server error' });
});

app.listen(port, (err) => {
	if (err) {
		throw err;
	}
	console.log('Express server has started on port ' + port);
});

const fs = require('node:fs/promises');
const path = require('node:path');

const userjsonDir = path.join(__dirname, '..', 'data', 'user.json');

async function readUsers() {
	const data = await fs.readFile(userjsonDir, 'utf8');
	return JSON.parse(data);
}

async function writeUsers(users) {
	await fs.writeFile(userjsonDir, JSON.stringify(users, null, '\t'), 'utf8');
}

function isValidUserBody(body) {
	return Boolean(body && body.password && body.name);
}

module.exports = function(app) {
	// 인덱스 페이지
	app.get('/', (req, res) => {
		const sess = req.session;

		console.log(sess);

		res.render('index', {
			title: 'MY HOMEPAGE',
			length: 5,
			name: sess.name,
			username: sess.username
		});
	});

	// 전체 리스트 페이지
	app.get('/list', async (req, res) => {
		const data = await fs.readFile(userjsonDir, 'utf8');
		res.end(data);
	});

	// 유저 1명 상세 페이지
	app.get('/getUser/:username', async (req, res) => {
		const users = await readUsers();
		res.json(users[req.params.username]);
	});

	// 유저 추가 RESTful API
	app.post('/addUser/:username', async (req, res) => {
		const username = req.params.username;

		// CHECK REQ VALIDITY
		if (!isValidUserBody(req.body)) {
			res.json({ success: 0, error: 'invalid request' });
			return;
		}

		// LOAD DATA & CHECK DUPLICATION
		const users = await readUsers();
		if (users[username]) {
			// DUPLICATION FOUND
			res.json({ success: 0, error: 'duplicate' });
			return;
		}

		// ADD TO DATA & SAVE
		users[username] = req.body;
		await writeUsers(users);
		res.json({ success: 1 });
	});

	// 유저 수정 RESTful API
	app.put('/updateUser/:username', async (req, res) => {
		const username = req.params.username;

		// CHECK REQ VALIDITY
		if (!isValidUserBody(req.body)) {
			res.json({ success: 0, error: 'invalid request' });
			return;
		}

		// LOAD DATA, ADD/MODIFY & SAVE
		const users = await readUsers();
		users[username] = req.body;
		await writeUsers(users);
		res.json({ success: 1 });
	});

	// 유저 삭제 RESTful API
	app.delete('/deleteUser/:username', async (req, res) => {
		const users = await readUsers();

		// IF NOT FOUND
		if (!users[req.params.username]) {
			res.json({ success: 0, error: 'not found' });
			return;
		}

		// DELETE FROM DATA & SAVE
		delete users[req.params.username];
		await writeUsers(users);
		res.json({ success: 1 });
	});

	// 로그인 모듈
	app.get('/login/:username/:password', async (req, res) => {
		const sess = req.session;
		const { username, password } = req.params;
		const users = await readUsers();

		if (!users[username]) {
			// USERNAME NOT FOUND
			res.json({ success: 0, error: 'not found' });
			return;
		}

		// JSON 바디로 숫자 비밀번호가 저장될 수 있으므로 기존 == 비교와 동일하게 문자열로 비교
		if (String(users[username].password) === password) {
			sess.username = username;
			sess.name = users[username].name;

			console.log(sess);
			console.log('username : ' + sess.username);
			console.log('name : ' + sess.name);

			res.json({ success: 1 });
		} else {
			res.json({ success: 0, error: 'incorrect' });
		}
	});

	// 로그아웃 모듈
	app.get('/logout', (req, res, next) => {
		const sess = req.session;
		if (!sess.username) {
			res.redirect('/');
			return;
		}

		sess.destroy((err) => {
			if (err) {
				next(err);
				return;
			}
			res.redirect('/');
		});
	});
};

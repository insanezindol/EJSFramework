// 스모크 테스트: 앱을 임시 디렉터리에 복사해서 실행하므로 원본 data/user.json은 변경되지 않는다.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const ROOT = path.join(__dirname, '..');
const APP_ENTRIES = ['server.js', 'router', 'views', 'public', 'data'];

let tmpDir;
let server;
let baseUrl;
let serverOutput = '';

function getFreePort() {
	return new Promise((resolve, reject) => {
		const srv = net.createServer();
		srv.unref();
		srv.on('error', reject);
		srv.listen(0, () => {
			const { port } = srv.address();
			srv.close(() => resolve(port));
		});
	});
}

async function waitForServer(url, timeoutMs = 10000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (server.exitCode !== null) {
			throw new Error('server exited early:\n' + serverOutput);
		}
		try {
			await fetch(url);
			return;
		} catch {
			await new Promise((r) => setTimeout(r, 100));
		}
	}
	throw new Error('server did not start in time:\n' + serverOutput);
}

function readUsers() {
	return JSON.parse(fs.readFileSync(path.join(tmpDir, 'data', 'user.json'), 'utf8'));
}

before(async () => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ejsframework-test-'));
	for (const entry of APP_ENTRIES) {
		fs.cpSync(path.join(ROOT, entry), path.join(tmpDir, entry), { recursive: true });
	}

	const port = await getFreePort();
	baseUrl = `http://127.0.0.1:${port}`;
	server = spawn(process.execPath, ['server.js'], {
		cwd: tmpDir,
		env: { ...process.env, PORT: String(port), NODE_PATH: path.join(ROOT, 'node_modules') },
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	server.stdout.on('data', (d) => { serverOutput += d; });
	server.stderr.on('data', (d) => { serverOutput += d; });

	await waitForServer(baseUrl + '/list');
});

after(async () => {
	if (server && server.exitCode === null && server.signalCode === null) {
		// Windows에서는 프로세스가 끝나야 cwd(임시 디렉터리)를 지울 수 있다
		const exited = new Promise((resolve) => server.once('exit', resolve));
		server.kill();
		await exited;
	}
	if (tmpDir) {
		fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
	}
});

test('GET / renders index page (logged out)', async () => {
	const res = await fetch(baseUrl + '/');
	assert.equal(res.status, 200);
	assert.match(res.headers.get('content-type'), /text\/html/);
	const html = await res.text();
	assert.match(html, /<title>\s*MY HOMEPAGE\s*<\/title>/);
	assert.match(html, /href="css\/style.css"/);
	for (let i = 0; i < 5; i++) {
		assert.ok(html.includes('LOOP' + i), 'LOOP' + i);
	}
	assert.ok(!html.includes('LOOP5'));
	assert.match(html, /Please Login\./);
});

test('GET /css/style.css serves static file', async () => {
	const res = await fetch(baseUrl + '/css/style.css');
	assert.equal(res.status, 200);
	assert.match(res.headers.get('content-type'), /text\/css/);
	const expected = fs.readFileSync(path.join(ROOT, 'public', 'css', 'style.css'), 'utf8');
	assert.equal(await res.text(), expected);
});

test('GET /list returns raw user.json content', async () => {
	const res = await fetch(baseUrl + '/list');
	assert.equal(res.status, 200);
	const body = await res.text();
	assert.equal(body, fs.readFileSync(path.join(tmpDir, 'data', 'user.json'), 'utf8'));
	assert.ok(JSON.parse(body).first_user);
});

test('GET /getUser/:username returns user', async () => {
	const res = await fetch(baseUrl + '/getUser/first_user');
	assert.equal(res.status, 200);
	assert.match(res.headers.get('content-type'), /application\/json/);
	assert.deepEqual(await res.json(), { password: 'first_pass', name: 'abet', auth: 'vistor' });
});

test('GET /getUser/:username for unknown user returns empty body', async () => {
	const res = await fetch(baseUrl + '/getUser/nobody');
	assert.equal(res.status, 200);
	assert.equal(await res.text(), '');
});

test('POST /addUser validates, adds and detects duplicates', async () => {
	let res = await fetch(baseUrl + '/addUser/new_user', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name: 'no password' }),
	});
	assert.deepEqual(await res.json(), { success: 0, error: 'invalid request' });

	res = await fetch(baseUrl + '/addUser/new_user', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password: 'pw', name: 'New User' }),
	});
	assert.deepEqual(await res.json(), { success: 1 });
	assert.deepEqual(readUsers().new_user, { password: 'pw', name: 'New User' });

	// urlencoded 바디도 지원해야 한다
	res = await fetch(baseUrl + '/addUser/new_user', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: 'password=pw2&name=Dup',
	});
	assert.deepEqual(await res.json(), { success: 0, error: 'duplicate' });
});

test('PUT /updateUser validates and updates', async () => {
	let res = await fetch(baseUrl + '/updateUser/second_user', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password: 'x' }),
	});
	assert.deepEqual(await res.json(), { success: 0, error: 'invalid request' });

	res = await fetch(baseUrl + '/updateUser/second_user', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: 'password=changed&name=Betty2',
	});
	assert.deepEqual(await res.json(), { success: 1 });
	assert.deepEqual(readUsers().second_user, { password: 'changed', name: 'Betty2' });
});

test('DELETE /deleteUser removes user or reports not found', async () => {
	let res = await fetch(baseUrl + '/deleteUser/new_user', { method: 'DELETE' });
	assert.deepEqual(await res.json(), { success: 1 });
	assert.equal(readUsers().new_user, undefined);

	res = await fetch(baseUrl + '/deleteUser/new_user', { method: 'DELETE' });
	assert.deepEqual(await res.json(), { success: 0, error: 'not found' });
});

test('login / session / logout flow', async () => {
	let res = await fetch(baseUrl + '/login/nobody/1111');
	assert.deepEqual(await res.json(), { success: 0, error: 'not found' });

	res = await fetch(baseUrl + '/login/jhlee/wrong');
	assert.deepEqual(await res.json(), { success: 0, error: 'incorrect' });

	res = await fetch(baseUrl + '/login/jhlee/1111');
	assert.deepEqual(await res.json(), { success: 1 });
	const cookie = res.headers.get('set-cookie').split(';')[0];
	assert.match(cookie, /^connect\.sid=/);

	res = await fetch(baseUrl + '/', { headers: { Cookie: cookie } });
	assert.match(await res.text(), /Welcome! jhlee \(name: Lee Jin Hyung\)/);

	res = await fetch(baseUrl + '/logout', { headers: { Cookie: cookie }, redirect: 'manual' });
	assert.equal(res.status, 302);
	assert.equal(res.headers.get('location'), '/');

	res = await fetch(baseUrl + '/', { headers: { Cookie: cookie } });
	assert.match(await res.text(), /Please Login\./);

	// 로그인하지 않은 상태의 로그아웃도 / 로 리다이렉트
	res = await fetch(baseUrl + '/logout', { redirect: 'manual' });
	assert.equal(res.status, 302);
	assert.equal(res.headers.get('location'), '/');
});

test('original data/user.json is untouched', () => {
	const original = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'user.json'), 'utf8'));
	assert.deepEqual(Object.keys(original), ['first_user', 'second_user', 'jhlee', 'mskim']);
	assert.equal(original.second_user.name, 'betty');
});

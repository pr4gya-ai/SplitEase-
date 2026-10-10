const router = require('express').Router();
const { wrap } = require('../middleware/error');
const auth = require('../middleware/auth');
const a = require('../controllers/authController');
const g = require('../controllers/groupController');
const e = require('../controllers/expenseController');
const b = require('../controllers/balanceController');

router.post('/auth/register', wrap(a.register));
router.post('/auth/login', wrap(a.login));
router.get('/auth/me', auth, wrap(a.me));
router.patch('/auth/me', auth, wrap(a.updateMe));

router.post('/groups', auth, wrap(g.create));
router.get('/groups', auth, wrap(g.list));
router.get('/groups/:groupId', auth, wrap(g.get));
router.post('/groups/:groupId/members', auth, wrap(g.addMember));

router.post('/groups/:groupId/expenses', auth, wrap(e.create));
router.post('/groups/:groupId/expenses/parse', auth, wrap(e.parse));
router.get('/groups/:groupId/expenses', auth, wrap(e.list));
router.delete('/groups/:groupId/expenses/:expenseId', auth, wrap(e.remove));

router.get('/groups/:groupId/balances', auth, wrap(b.getBalances));
router.post('/groups/:groupId/settlements', auth, wrap(b.settle));

module.exports = router;

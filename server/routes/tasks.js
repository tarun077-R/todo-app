const express = require('express');
const {
  create,
  list,
  get,
  update,
  remove,
  complete,
  restore,
  search,
  filterList,
  sortTasks,
  dashboard,
} = require('../controllers/tasks');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', create);
router.get('/', list);
router.get('/search', search);
router.get('/filters', filterList);
router.get('/sort', sortTasks);
router.get('/dashboard', dashboard);
router.get('/:id', get);
router.patch('/:id', update);
router.patch('/:id/complete', complete);
router.patch('/:id/restore', restore);
router.delete('/:id', remove);

module.exports = router;

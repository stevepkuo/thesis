const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = require('redis').createClient();
const models = require('../../db/models');

//for testing purposes to set up a fake login session
module.exports.fakemiddleware = (req, res, next) => {
  if (req && req.session && req.session.user_tmp) {
    req.user = req.session.user_tmp;
  }
  if (next) {
    next();
  }
};

module.exports.verify = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

module.exports.verifyElse401 = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(401);
};

module.exports.verifyBoardMemberElse401 = (req, res, next) => {
  var boardid;
  if (!req.params && !req.body) {
    res.status(400).send('board id couldnt be found in request from client');
  }
  if (!req.params.id) {
    boardid = parseInt(req.body.id);
  } else {
    boardid = parseInt(req.params.id);
  }
  var userId = req.user.id;

  // return models.User.where({ id: userId }).fetch({withRelated:['memberOfBoards']})
  // .then(function(user) {
  //   return user.related('memberOfBoards');
  // })

  //see whether the boardid shows up under any of the users boards
  return models.User.where({ id: userId }).fetch()
    .then(function(user) {
      return user.related('memberOfBoards').fetch();
    })
    .then(boards => {
      return boards.toJSON().filter((eachBoard) => {
        return eachBoard.id === boardid;
      });
    })

    .then(function(results) {
      if (results.length === 0) {
        res.status(401).send();
      }
      return next();
    })
    .error(err => {
      res.status(500).send();
    });
};

module.exports.verifyBoardOwnerElse401 = (req, res, next) => {
  var boardid;
  if (!req.params && !req.body) {
    res.status(400).send('board id couldnt be found in request from client');
  }
  if (!req.params.id) {
    boardid = parseInt(req.body.id);
  } else {
    boardid = parseInt(req.params.id);
  }
  var userId = req.user.id;
  //see whether the boardid's shows up under any of the users boards
  return models.Board.where({ id: boardid }).fetch()
    .then(function(board) {
      return board.toJSON().owner_id === userId;
    })
    .then(ownsBoard => {
      if (!ownsBoard) {
        res.status(401).send();
      }
      return next();
    })
    .error(err => {
      res.status(500).send();
    });
};

module.exports.session = session({
  store: new RedisStore({
    client: redisClient,
    host: 'localhost',
    port: 6379
  }),
  secret: 'more laughter, more love, more life',
  resave: false,
  saveUninitialized: false
});

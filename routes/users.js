const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs")
const passport = require('passport');
//User Model
const User = require('../models/User');

function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    req.flash('error_msg', 'You are already logged in');
    return res.redirect('/users/dashboard');
  }
  next();
}

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { message: req.flash('error') });
});

// Register page
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register');
});

// register Handler
router.post('/register', redirectIfAuthenticated, (req, res) => {
  const {
    name,
    username,
    email,
    password,
    password2
  } = req.body;

  let errors = [];
  if (!name || !username || !email || !password || !password2) {
    errors.push({
      msg: 'Please enter fill in all required fields'
    });
  }

  if (password !== password2) {
    errors.push({
      msg: 'Passwords do not match'
    });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      username,
      email,
      password,
      password2
    })
  } else {
    // Validation passed
    User.findOne({
        $or: [{
          email: email
        }, {
          username: username
        }]
      })
      .then(user => {
          if (user) {
            // User exists
            if (user.email === email) {
              errors.push({
                msg: 'email is already registered '
              });
            }
            if (user.username === username) {
              errors.push({
                msg: 'username is already registered '
              });
            }
            res.render('register', {
              errors,
              name,
              username,
              email,
              password,
              password2
            });
          } else {
            const newUser = new User({
              name,
              username,
              email,
              password,
            });
            //hash password
            bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              //set password to hashed
              newUser.password = hash;
              //save user
              newUser.save()
                .then(user => {
                  req.flash('success_msg', 'you are now registered')
                  res.redirect('/users/login')
                })
                .catch(err => console.log(err));

            }))
          }
        }

      )
  }

});

router.post('/login', redirectIfAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/users/login');
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect('/users/dashboard');
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});



router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  if (req.user.role === 'admin') {
    
    try {
      const users = await User.find();
      res.render('admin_dashboard', {
        user: req.user,
        users
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  } else {
    
    res.render('user_dashboard', {
      user: req.user
    });
  }
});


router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  if (req.user.role === 'admin') {
    try {
      const user = await User.findById(req.params.id);
      res.render('edit_user', {
        user
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  } else {
    req.flash('error_msg', 'You are not authorized to view this resource');
    res.redirect('/users/dashboard');
  }
});


router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
  if (req.user.role === 'admin') {
    const {
      name,
      email,
      role
    } = req.body;
    try {
      const user = await User.findById(req.params.id);
      user.name = name;
      user.email = email;
      if (role) user.role = role;
      await user.save();
      req.flash('success_msg', 'User updated successfully');
      res.redirect('/users/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  } else {
    req.flash('error_msg', 'You are not authorized to perform this action');
    res.redirect('/users/dashboard');
  }
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view that resource');
  res.redirect('/users/login');
}


module.exports = router;